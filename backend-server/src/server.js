const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const adminRoutes = require('./routes/admin.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const screenshotRoutes = require('./routes/screenshot.routes');
const settingsRoutes = require('./routes/settings.routes');
const alertRoutes = require('./routes/alert.routes');
const reportRoutes = require('./routes/report.routes');
const recordingRoutes = require('./routes/recording.routes');
const turnRoutes = require('./routes/turn.routes');

// Import cron jobs
const { monthlyReportJob } = require('./services/cron.service');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  maxHttpBufferSize: 1e8, // 100 MB
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files (screenshots, etc.)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/turn', turnRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Temporary Migration Link - RUN THIS ONCE IN BROWSER
app.get('/api/fix-db', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query(`ALTER TABLE attendance_sessions MODIFY COLUMN state ENUM('WORKING', 'BREAK', 'IDLE', 'OFFLINE', 'OFF') NOT NULL`);
    res.send('<h1>✓ Database Fixed!</h1><p>The "OFF" status has been added to the database. You can now close this page.</p>');
  } catch (error) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const jwt = require('jsonwebtoken');

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Socket Auth Error:', err.message);
    next(); // Still allow connection, but it won't be authenticated
  }
});

// Map to track connected employees
const connectedEmployees = new Map(); // socket.id -> employeeId

// WebSocket for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, socket.user ? `(User: ${socket.user.id}, Role: ${socket.user.type})` : '(Anonymous)');

  if (socket.user && socket.user.type === 'employee') {
    connectedEmployees.set(socket.id, socket.user.id);

    // Join a room specific to this employee for targeted signaling
    socket.join(`employee:${socket.user.id}`);

    // Notify admins immediately that employee is online
    io.to('admin-room').emit('employee:activity', {
      employeeId: socket.user.id,
      status: 'WORKING', // Assume online means working initially
      timestamp: new Date().toISOString()
    });
  }

  // Employee heartbeat
  socket.on('employee:heartbeat', async (data) => {
    try {
      // Ensure they are in their room if they reconnected without full handshake logic
      if (data.employeeId) {
        socket.join(`employee:${data.employeeId}`);
      }

      // Broadcast to admin dashboard
      io.to('admin-room').emit('employee:activity', {
        employeeId: data.employeeId,
        status: data.status,
        timestamp: data.timestamp
      });
    } catch (error) {
      logger.error('Heartbeat error:', error);
    }
  });

  // Employee signal that video component is mounted and ready
  socket.on('employee:live-ready', () => {
    if (socket.user && socket.user.id) {
      console.log(`[Video] Employee ${socket.user.id} is ready for live streaming (Socket ${socket.id})`);
      io.to('admin-room').emit('employee:video-ready', {
        employeeId: socket.user.id,
        isReady: true,
        socketId: socket.id
      });
    }
  });

  // Admin live screen request
  socket.on('admin:request-live-screen', async (data) => {
    try {
      const { employeeId, adminId } = data;

      // Check if employee is actually connected via socket
      const employeeRoom = `employee:${employeeId}`;
      const connectedClients = io.sockets.adapter.rooms.get(employeeRoom);

      console.log(`[LiveScreen] Admin ${adminId} requested screen for ${employeeId}`);

      if (!connectedClients || connectedClients.size === 0) {
        console.log(`[LiveScreen] ❌ Employee ${employeeId} not connected for signalling`);
        return socket.emit('admin:stream-error', {
          employeeId,
          message: 'Employee is not connected for live monitoring. Please wait a few seconds for their connection to stabilize.'
        });
      }

      console.log(`[LiveScreen] 📤 Sending start-stream to room ${employeeRoom}`);

      // Notify employee app in their specific room
      io.to(employeeRoom).emit(`employee:${employeeId}:start-stream`, {
        adminId,
        adminSocketId: socket.id
      });
    } catch (error) {
      logger.error('Live screen request error:', error);
    }
  });

  // Admin stop live screen request
  socket.on('admin:stop-live-screen', (data) => {
    const { employeeId } = data;
    io.emit(`employee:${employeeId}:stop-stream`, { adminSocketId: socket.id });
  });

  // WebRTC Signaling Events
  socket.on('webrtc:offer', (data) => {
    console.log('----------------------------------------');
    console.log(`[WebRTC Signaling] 📤 Offer from ${socket.id}`);
    console.log(`[WebRTC Signaling] 🎯 To Admin ${data.targetSocketId}`);

    // Forward offer to the specific admin socket
    io.to(data.targetSocketId).emit('webrtc:offer', {
      sdp: data.sdp,
      senderSocketId: socket.id
    });
    console.log('----------------------------------------');
  });

  socket.on('webrtc:answer', (data) => {
    console.log('----------------------------------------');
    console.log(`[WebRTC Signaling] 📥 Answer from ${socket.id}`);
    console.log(`[WebRTC Signaling] 🎯 To Employee ${data.targetSocketId}`);

    // Forward answer back to the employee
    io.to(data.targetSocketId).emit('webrtc:answer', {
      sdp: data.sdp,
      senderSocketId: socket.id
    });
    console.log('----------------------------------------');
  });

  socket.on('webrtc:ice-candidate', (data) => {
    // console.log(`[ICE] Candidate from ${socket.id} to ${data.targetSocketId}`);
    io.to(data.targetSocketId).emit('webrtc:ice-candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id
    });
  });

  socket.on('admin:request-screenshot', async (data) => {
    try {
      const { employeeId, adminId } = data;
      console.log(`Admin ${adminId} requested screenshot for employee ${employeeId}`);

      // Notify employee app to capture screenshot
      io.emit(`employee:${employeeId}:capture-screenshot`, {
        adminId
      });
    } catch (error) {
      logger.error('Screenshot request error:', error);
    }
  });

  // Employee live screen stream
  socket.on('employee:screen-frame', (data) => {
    // console.log(`Received frame from ${data.employeeId}, size: ${data.frame.length}`);
    // Forward to admin
    io.to('admin-room').emit('admin:screen-frame', data);
  });

  // Admin joins admin room
  socket.on('admin:join', (adminId) => {
    socket.join('admin-room');
    console.log('Admin joined:', adminId);
  });

  // Config update notification
  socket.on('admin:config-updated', (data) => {
    // Notify specific employee or all employees
    if (data.employeeId) {
      io.emit(`employee:${data.employeeId}:config-update`, data.settings);
    } else {
      io.emit('employee:config-update', data.settings);
    }
  });

  socket.on('disconnect', () => {
    const employeeId = connectedEmployees.get(socket.id);
    if (employeeId) {
      console.log(`Employee disconnected: ${employeeId}, Socket: ${socket.id}`);
      // Notify admins immediately
      io.to('admin-room').emit('employee:activity', {
        employeeId: employeeId,
        status: 'OFF',
        timestamp: new Date().toISOString()
      });
      connectedEmployees.delete(socket.id);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });
});

// Make io available to routes
app.set('io', io);

// Cron jobs
// Run monthly report every 1st day of month at 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('Running monthly report cron job...');
  await monthlyReportJob();
});

// Cleanup old screenshots every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running screenshot cleanup...');
  const { cleanupOldScreenshots } = require('./services/screenshot.service');
  await cleanupOldScreenshots();
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Cannot start server without database connection');
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
      logger.info(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };
