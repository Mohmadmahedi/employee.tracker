const express = require('express');
const router = express.Router();
const recordingController = require('../controllers/recording.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// List recordings - Admin only
router.get('/list', isAdmin, recordingController.getRecordings);

// Upload recording - Both Admin (from dashboard) and potentially Employee (if auto-recording implemented)
// For now, we allow both authenticated users
// Upload recording - Both Admin (from dashboard) and potentially Employee (if auto-recording implemented)
// For now, we allow both authenticated users
router.post('/upload', recordingController.uploadRecording);

// Delete recording - Admin only
router.delete('/:id', isAdmin, recordingController.deleteRecording);

module.exports = router;
