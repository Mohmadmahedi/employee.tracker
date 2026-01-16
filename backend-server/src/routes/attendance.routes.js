const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Attendance routes
router.use(authenticate);

router.post('/heartbeat', attendanceController.heartbeat);
router.get('/daily/:date', attendanceController.getDailyStats);

module.exports = router;
