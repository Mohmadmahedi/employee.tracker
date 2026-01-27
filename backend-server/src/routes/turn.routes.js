const express = require('express');
const router = express.Router();
const turnController = require('../controllers/turn.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Protected route to get secure TURN credentials
router.get('/', authenticate, turnController.getTurnCredentials);

module.exports = router;
