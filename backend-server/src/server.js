// Force restart
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

// TRUST PROXY (Required for Render/Cloud hosting)
app.set('trust proxy', 1);

const io = socketIO(server, {
  maxHttpBufferSize: 1e8, // 100 MB
  pingTimeout: 60000,     // Increase timeout to 60s
  pingInterval: 25000,    // Send ping every 25s to keep connection alive
  transports: ['websocket', 'polling'], // Allow fallback
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

// Keep-Alive Endpoint (For Automation)
app.get('/api/keep-alive', (req, res) => {
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 3000, // Increased from 1000 to 3000 to handle multiple admins/reconnections
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, message: 'Too many requests from this IP, please try again later.' }
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

// ALERT TYPE FIX - Run this if you see "Data truncated" errors
app.get('/api/fix-db-alerts', async (req, res) => {
  try {
    const db = require('./config/database');
    // Modify the enum to include the long types or just change to VARCHAR for flexibility
    // The error is likely because the ENUM definition in schema doesn't match what we are sending, 
    // OR we are sending 'RESTRICTED_APP_DETECTED' but the enum only has 'UNINSTALL_ATTEMPT', etc.
    // The safest fix is to change it to a VARCHAR(50) so it accepts any string.
    await db.query(`ALTER TABLE tamper_alerts MODIFY COLUMN alert_type VARCHAR(50) NOT NULL`);
    res.send('<h1>✓ Alerts Fixed!</h1><p>The alerts table has been updated to accept longer types. You is good to go.</p>');
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
const employeeVideoStatus = new Map(); // employeeId -> boolean (isReady)
const pendingVideoRequests = new Map(); // employeeId -> [{ adminSocketId, adminId, timeout }]

// PERSISTENT SUBSCRIPTIONS: employeeId -> Set<adminSocketId>
// Tracks which admins are *trying* to watch an employee, even if the employee is temporarily offline.
const activeSubscriptions = new Map();

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
    // ... (keep existing)
    try {
      if (data.employeeId) {
        socket.user = { id: data.employeeId, ...socket.user };
        socket.join(`employee:${data.employeeId}`);
      }
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
      const empId = socket.user.id;
      const roomName = `employee:${empId}`;
      socket.join(roomName);
      console.log(`[Socket] Video Socket for ${empId} forced into room: ${roomName}`);

      // Mark as Ready
      employeeVideoStatus.set(empId, true);
      console.log(`[Video] Employee ${empId} is ready for live streaming (Socket ${socket.id})`);

      // Notify admin
      io.to('admin-room').emit('employee:video-ready', {
        employeeId: empId,
        isReady: true,
        socketId: socket.id
      });

      // 1. Process Pending Queue (One-time requests that failed/timed out)
      if (pendingVideoRequests.has(empId)) {
        const queue = pendingVideoRequests.get(empId);
        console.log(`[Queue] Processing ${queue.length} pending requests for ${empId}`);

        queue.forEach(req => {
          clearTimeout(req.timeout); // Clear the fail-safe timeout
          io.to(roomName).emit(`employee:${empId}:start-stream`, {
            adminId: req.adminId,
            adminSocketId: req.adminSocketId
          });
          console.log(`[Queue] 🚀 Launched deferred stream for Admin ${req.adminId}`);

          // Also add to active subscriptions for persistence
          if (!activeSubscriptions.has(empId)) activeSubscriptions.set(empId, new Set());
          activeSubscriptions.get(empId).add(req.adminSocketId);
        });

        pendingVideoRequests.delete(empId);
      }

      // 2. CHECK ACTIVE SUBSCRIPTIONS (Auto-Restore)
      // If admins were watching this employee (or trying to) before they reconnected/rebooted.
      if (activeSubscriptions.has(empId)) {
        const admins = activeSubscriptions.get(empId);
        if (admins.size > 0) {
          console.log(`[AutoRestore] Found ${admins.size} active listeners for ${empId}. Restoring streams...`);
          admins.forEach(adminSocketId => {
            // Check if admin is still connected
            const adminSocket = io.sockets.sockets.get(adminSocketId);
            if (adminSocket) {
              // Send start command
              io.to(roomName).emit(`employee:${empId}:start-stream`, {
                adminSocketId: adminSocketId
                // We don't necessarily have adminId here easily without lookups, but usually adminSocketId is enough for signaling
              });
              console.log(`[AutoRestore] 🔄 Restoring stream for Admin Socket ${adminSocketId}`);
            } else {
              // Admin disconnected, remove from set
              admins.delete(adminSocketId);
            }
          });
        }
      }
    }
  });

  // Admin live screen request
  socket.on('admin:request-live-screen', async (data) => {
    try {
      const { employeeId, adminId } = data;
      const employeeRoom = `employee:${employeeId}`;
      console.log(`[LiveScreen] Admin ${adminId} requested screen for ${employeeId}`);

      // ADD TO ACTIVE SUBSCRIPTIONS
      if (!activeSubscriptions.has(employeeId)) activeSubscriptions.set(employeeId, new Set());
      activeSubscriptions.get(employeeId).add(socket.id);
      console.log(`[LiveScreen] Admin ${socket.id} added to active subscriptions for ${employeeId}`);

      // CHECK 1: Is employee completely offline?
      // We check if the room exists and has members.
      const room = io.sockets.adapter.rooms.get(employeeRoom);
      if (!room || room.size === 0) {
        console.log(`[LiveScreen] ❌ Employee ${employeeId} offline.`);
        // We do NOT return error immediately if we want to wait for them to come online
        // But for UI feedback, we can say "Waiting..."
        socket.emit('admin:stream-status', { status: 'waiting_for_employee', message: 'Employee offline, waiting for connection...' });
        return;
      }

      // CHECK 2: Is their Video Component ready?
      if (!employeeVideoStatus.get(employeeId)) {
        console.log(`[LiveScreen] ⏳ Employee online but Video NOT ready. Queuing request...`);

        // Queue this request
        const timeout = setTimeout(() => {
          // Fail-safe: If they never become ready after 10s, cancel.
          const q = pendingVideoRequests.get(employeeId) || [];
          const filtered = q.filter(item => item.adminSocketId !== socket.id);
          if (filtered.length === 0) pendingVideoRequests.delete(employeeId);
          else pendingVideoRequests.set(employeeId, filtered);

          // We don't error out anymore, we just keep waiting because it's in activeSubscriptions
          socket.emit('admin:stream-status', { status: 'waiting_for_employee', message: 'Waiting for employee app initialization...' });
        }, 10000);

        const newItem = { adminSocketId: socket.id, adminId, timeout };

        if (pendingVideoRequests.has(employeeId)) {
          pendingVideoRequests.get(employeeId).push(newItem);
        } else {
          pendingVideoRequests.set(employeeId, [newItem]);
        }
        return;
      }

      // If Ready, send immediately
      console.log(`[LiveScreen] 📤 Sending start-stream to room ${employeeRoom}`);
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

    // REMOVE FROM SUBSCRIPTIONS
    if (activeSubscriptions.has(employeeId)) {
      activeSubscriptions.get(employeeId).delete(socket.id);
      console.log(`[LiveScreen] Admin ${socket.id} unsubscribed from ${employeeId}`);
    }

    io.emit(`employee:${employeeId}:stop-stream`, { adminSocketId: socket.id });
  });

  // Handle Stream Failures (Feedback Loop)
  socket.on('employee:stream-failed', (data) => {
    console.log(`[Stream Error] Employee ${socket.id} failed to stream: ${data.error}`);
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('admin:stream-error', {
        employeeId: socket.user?.id || 'Unknown',
        message: data.error
      });
    }
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

    // SEND INITIAL STATE SYNC
    // Send list of all employees who are currently "Video Ready"
    const readyEmployees = [];
    employeeVideoStatus.forEach((isReady, id) => {
      if (isReady) readyEmployees.push(id);
    });

    if (readyEmployees.length > 0) {
      console.log(`[Sync] Sending video-ready list to new Admin: ${readyEmployees.length} employees`);
      socket.emit('admin:initial-video-state', readyEmployees);
    }
  });

  // Config update notification
  socket.on('admin:config-updated', (data) => {
    // ... (keep existing)
    if (data.employeeId) {
      io.emit(`employee:${data.employeeId}:config-update`, data.settings);
    } else {
      io.emit('employee:config-update', data.settings);
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    // SECURITY: Ensure we don't run employee cleanup for Admins
    if (socket.user && (socket.user.type === 'admin' || socket.user.role === 'SUPER_ADMIN')) {
      console.log(`[Socket] Admin ${socket.user.id} disconnected.`);
      // If admin disconnects, we should probably remove their subscriptions
      // But we need to iterate the map since it's keyed by employeeId
      activeSubscriptions.forEach((admins, employeeId) => {
        if (admins.has(socket.id)) {
          admins.delete(socket.id);
          console.log(`[Cleanup] Removed Admin subscription for ${employeeId} on disconnect`);
          // Optionally notify employee to stop streaming to this admin (if supporting multi-cast someday, current implementation usually stops all)
          io.emit(`employee:${employeeId}:stop-stream`, { adminSocketId: socket.id });
        }
      });
      return;
    }

    let empId = socket.user?.id;

    // Fallback: check map provided earlier in handshake
    if (!empId && connectedEmployees.has(socket.id)) {
      empId = connectedEmployees.get(socket.id);
    }

    if (empId) {
      console.log(`[Socket] User ${empId} socket disconnected: ${socket.id}`);
      connectedEmployees.delete(socket.id);

      // CRITICAL FIX: Only notify admin if ALL sockets for this employee are gone.
      // We check the specific employee room size.
      const roomName = `employee:${empId}`;
      const room = io.sockets.adapter.rooms.get(roomName);

      if (!room || room.size === 0) {
        console.log(`[Socket] Employee ${empId} fully offline (no sockets left).`);

        // Notify admins
        io.to('admin-room').emit('employee:disconnected', {
          employeeId: empId
        });

        // Clear video status and pending requests
        employeeVideoStatus.delete(empId);
        pendingVideoRequests.delete(empId);

        // NOTE: We do NOT delete from activeSubscriptions here.
        // We want to remember that an admin was watching, so when they reconnect, we resume.

        // Also send activity update to OFF
        io.to('admin-room').emit('employee:activity', {
          employeeId: empId,
          status: 'OFF',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`[Socket] Employee ${empId} still has ${room.size} active socket(s). Ignoring disconnect.`);
      }
    } else {
      // Just standard cleanup if it was tracked by socketID
      if (connectedEmployees.has(socket.id)) connectedEmployees.delete(socket.id);
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
