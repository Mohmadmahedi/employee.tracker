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
  maxHttpBufferSize: 1e8, // 100 MB
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ... (middleware content skipped in replacement, but kept in file) ...

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
