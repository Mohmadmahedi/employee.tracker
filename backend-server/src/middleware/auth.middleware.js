const jwt = require('jsonwebtoken');

const db = require('../config/database');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists in DB
    let userExists = false;
    if (decoded.type === 'admin') {
      const [admin] = await db.query('SELECT id FROM admin_users WHERE id = ?', [decoded.id]);
      userExists = !!admin;
    } else {
      const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [decoded.id]);
      userExists = !!employee;
    }

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        shouldLogout: true
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Verify admin role
exports.isAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Verify employee role
exports.isEmployee = (req, res, next) => {
  if (req.user.type !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Employee access only'
    });
  }
  next();
};

module.exports = exports;
