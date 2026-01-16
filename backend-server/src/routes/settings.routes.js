const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Global settings
router.get('/global', settingsController.getGlobalSettings);
router.put('/global/:setting_key', settingsController.updateGlobalSetting);
router.post('/global/bulk-update', settingsController.bulkUpdateSettings);

// Employee-specific settings
router.get('/employee/:employeeId', settingsController.getEmployeeSettings);
router.put('/employee/:employeeId/:setting_key', settingsController.setEmployeeSetting);
router.delete('/employee/:employeeId/override/:settingKey', settingsController.removeEmployeeOverride);

// Config history
router.get('/history', settingsController.getConfigHistory);

// Import/Export
router.get('/export', settingsController.exportSettings);
router.post('/import', settingsController.importSettings);

module.exports = router;
