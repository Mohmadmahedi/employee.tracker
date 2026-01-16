const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Generate JWT tokens
const generateTokens = (user, type = 'employee') => {
  const payload = {
    id: user.id,
    email: user.email,
    type: type
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });

  return { accessToken, refreshToken };
};

// Employee Login
exports.employeeLogin = async (req, res) => {
  try {
    const { email, password, full_name, consent_accepted, pc_name, ip_address } = req.body;

    // Check if employee exists
    let [employee] = await db.query(
      'SELECT * FROM employees WHERE email = ?',
      [email]
    );

    // First time registration
    if (!employee) {
      if (!full_name || !consent_accepted) {
        return res.status(400).json({
          success: false,
          message: 'First time login requires full name and consent'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new employee
      const employeeId = uuidv4();
      await db.query(
        `INSERT INTO employees (id, email, password_hash, full_name, consent_accepted_at, consent_version, consent_ip, pc_name, last_seen)
         VALUES (?, ?, ?, ?, NOW(), '1.0', ?, ?, NOW())`,
        [employeeId, email, passwordHash, full_name, ip_address, pc_name]
      );

      // Fetch created employee
      [employee] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);

      // Trigger Google Sheet creation (async)
      const { createEmployeeSheet } = require('../services/sheets.service');
      createEmployeeSheet(employeeId, full_name).catch(err => {
        logger.error('Sheet creation error:', err);
      });

      logger.info(`New employee registered: ${email}`);
    } else {
      // Existing employee - verify password
      const isValidPassword = await bcrypt.compare(password, employee.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last seen
      await db.query(
        'UPDATE employees SET last_seen = NOW(), pc_name = ? WHERE id = ?',
        [pc_name, employee.id]
      );
    }

    if (!employee.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(employee, 'employee');

    // Get employee settings
    const settings = await db.query('CALL GetAllEmployeeSettings(?)', [employee.id]);

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (id, actor_type, actor_id, action, description, ip_address)
       VALUES (?, 'EMPLOYEE', ?, 'LOGIN', 'Employee logged in', ?)`,
      [uuidv4(), employee.id, ip_address || null]
    );

    res.json({
      success: true,
      message: employee.consent_accepted_at ? 'Login successful' : 'Registration successful',
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        employee: {
          id: employee.id,
          email: employee.email,
          full_name: employee.full_name,
          google_sheet_url: employee.google_sheet_url
        },
        settings: settings[0] // Desktop app will use these settings
      }
    });

  } catch (error) {
    logger.error('Employee login error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password, ip_address } = req.body;
    console.log('DEBUG: Admin Login Attempt:', { email, ip_address, passwordProvided: !!password });

    // Find admin
    const [admin] = await db.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await db.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin, 'admin');

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (id, actor_type, actor_id, action, description, ip_address)
       VALUES (?, 'ADMIN', ?, 'LOGIN', 'Admin logged in', ?)`,
      [uuidv4(), admin.id, ip_address || null]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role
        }
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
};

// Verify Admin Password (for uninstall)
exports.verifyAdminPassword = async (req, res) => {
  try {
    const { password, employee_id } = req.body;

    // Try to verify against master password first
    if (password === process.env.ADMIN_MASTER_PASSWORD) {
      // Log the attempt
      await db.query(
        `INSERT INTO activity_logs (id, actor_type, actor_id, action, description)
         VALUES (?, 'EMPLOYEE', ?, 'UNINSTALL_APPROVED', 'Master password used for uninstall')`,
        [uuidv4(), employee_id]
      );

      return res.json({
        success: true,
        message: 'Password verified',
        data: { approved: true }
      });
    }

    // Check against any admin password
    const admins = await db.query(
      'SELECT password_hash, uninstall_password_hash FROM admin_users WHERE is_active = TRUE'
    );

    for (const admin of admins) {
      const isValid = await bcrypt.compare(password, admin.password_hash);
      const isUninstallValid = admin.uninstall_password_hash &&
        await bcrypt.compare(password, admin.uninstall_password_hash);

      if (isValid || isUninstallValid) {
        // Log approval
        await db.query(
          `INSERT INTO activity_logs (id, actor_type, actor_id, action, description)
           VALUES (?, 'EMPLOYEE', ?, 'UNINSTALL_APPROVED', 'Admin password verified for uninstall')`,
          [uuidv4(), employee_id]
        );

        return res.json({
          success: true,
          message: 'Password verified',
          data: { approved: true }
        });
      }
    }

    // Password incorrect - log the failed attempt
    await db.query(
      `INSERT INTO tamper_alerts (id, employee_id, alert_type, action_attempted, status, alert_time)
       VALUES (?, ?, 'UNINSTALL_ATTEMPT', 'Incorrect password entered', 'BLOCKED', NOW())`,
      [uuidv4(), employee_id]
    );

    res.status(401).json({
      success: false,
      message: 'Invalid password',
      data: { approved: false }
    });

  } catch (error) {
    logger.error('Verify admin password error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new tokens
    const newTokens = generateTokens(
      { id: decoded.id, email: decoded.email },
      decoded.type
    );

    res.json({
      success: true,
      data: {
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Request Uninstall
exports.requestUninstall = async (req, res) => {
  try {
    const { employee_id, reason } = req.body;

    const requestId = uuidv4();

    await db.query(
      `INSERT INTO uninstall_requests (id, employee_id, reason, requested_at, status)
       VALUES (?, ?, ?, NOW(), 'PENDING')`,
      [requestId, employee_id, reason]
    );

    // Create alert
    await db.query(
      `INSERT INTO tamper_alerts (id, employee_id, alert_type, action_attempted, status, alert_time)
       VALUES (?, ?, 'UNINSTALL_ATTEMPT', 'Uninstall requested', 'PENDING', NOW())`,
      [uuidv4(), employee_id]
    );

    res.json({
      success: true,
      message: 'Uninstall request submitted. Please wait for admin approval.',
      data: { request_id: requestId }
    });

    logger.info(`Uninstall requested by employee: ${employee_id}`);
  } catch (error) {
    logger.error('Request uninstall error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit request'
      });
    }
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'admin') {
      const [admin] = await db.query('SELECT id, email, full_name, role FROM admin_users WHERE id = ?', [decoded.id]);
      if (!admin) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, data: admin });
    } else {
      const [employee] = await db.query('SELECT id, email, full_name, google_sheet_url FROM employees WHERE id = ?', [decoded.id]);
      if (!employee) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, data: employee });
    }
  } catch (error) {
    logger.error('Get current user error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = exports;
