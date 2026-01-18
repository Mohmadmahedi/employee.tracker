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

// Import cron jobs
const { monthlyReportJob } = require('./services/cron.service');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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

// WebSocket for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Employee heartbeat
  socket.on('employee:heartbeat', async (data) => {
    try {
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

  // Admin live screen request
  socket.on('admin:request-live-screen', async (data) => {
    try {
      const { employeeId, adminId } = data;

      // Notify employee app to start streaming
      io.emit(`employee:${employeeId}:start-stream`, {
        adminId,
        sessionId: socket.id
      });
    } catch (error) {
      logger.error('Live screen request error:', error);
    }
  });

  // Admin request immediate screenshot
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
    console.log('Client disconnected:', socket.id);
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
