const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Employee routes
router.post('/employee/login', authController.employeeLogin);
router.post('/employee/request-uninstall', authController.requestUninstall);

// Admin routes
router.post('/admin/login', authController.adminLogin);
router.post('/admin/verify-password', authController.verifyAdminPassword);

// Common
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authController.getCurrentUser);

router.get('/setup-default', authController.setupDefaultAdmin);

router.get('/fix-schema', authController.fixSchema);

module.exports = router;
