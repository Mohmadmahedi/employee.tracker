const express = require('express');
const router = express.Router();
const { authenticate, isEmployee } = require('../middleware/auth.middleware');

// Placeholder routes - to be implemented
router.get('/profile', authenticate, isEmployee, (req, res) => {
  res.json({ success: true, message: 'Employee routes - coming soon' });
});

module.exports = router;
