const express = require('express');
const router = express.Router();
const screenshotController = require('../controllers/screenshot.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// Employee upload route
router.post('/upload', authenticate, screenshotController.uploadScreenshot);

// Admin view route
// Admin view route
router.get('/list', authenticate, isAdmin, screenshotController.getScreenshots);

// Delete screenshot - Admin only
router.delete('/:id', authenticate, isAdmin, screenshotController.deleteScreenshot);

module.exports = router;
