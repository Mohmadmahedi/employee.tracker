const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const reportController = require('../controllers/report.controller');

// Report routes
router.get('/attendance', authenticate, reportController.getAttendanceReport);
router.get('/summary', authenticate, reportController.getSummaryStats);

module.exports = router;
