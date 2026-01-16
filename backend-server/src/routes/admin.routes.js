const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * Get all employees with their current status
 */
router.get('/employees', async (req, res) => {
  try {
    const employees = await db.query(`
      SELECT e.id, e.email, e.full_name, e.department, e.is_active, e.last_seen, e.pc_name, e.google_sheet_url,
             (SELECT state FROM attendance_sessions WHERE employee_id = e.id ORDER BY timestamp DESC LIMIT 1) as current_status
      FROM employees e
      ORDER BY e.full_name ASC
    `);

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Admin get employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

/**
 * Get dashboard overview stats
 */
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total employees
    const [totalEmployees] = await db.query('SELECT COUNT(*) as count FROM employees WHERE is_active = TRUE');

    // Active Now (last seen in last 5 minutes)
    const [activeNow] = await db.query(
      'SELECT COUNT(*) as count FROM employees WHERE last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND is_active = TRUE'
    );

    // Alerts Today
    const [alertsToday] = await db.query(
      'SELECT COUNT(*) as count FROM tamper_alerts WHERE DATE(alert_time) = ?',
      [today]
    );

    // Working Hours Today
    const [totalHours] = await db.query(
      'SELECT SUM(working_hours) as count FROM daily_attendance WHERE attendance_date = ?',
      [today]
    );

    res.json({
      success: true,
      data: {
        totalEmployees: totalEmployees.count || 0,
        activeNow: activeNow.count || 0,
        alertsToday: alertsToday.count || 0,
        workingHoursToday: parseFloat(totalHours?.count || 0).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    logger.error('Admin get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

/**
 * Add a new employee
 */
router.post('/employees', async (req, res) => {
  try {
    const { full_name, email, password, department } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    const employeeId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO employees (id, email, password_hash, full_name, department, consent_accepted_at, is_active)
       VALUES (?, ?, ?, ?, ?, NOW(), TRUE)`,
      [employeeId, email, passwordHash, full_name, department || null]
    );

    res.json({
      success: true,
      message: 'Employee created successfully',
      data: { id: employeeId, email, full_name, department }
    });
  } catch (error) {
    logger.error('Admin add employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to add employee' });
  }
});

/**
 * Update an employee
 */
router.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, department } = req.body;

    // Check if employee exists
    const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update fields
    const updates = [];
    const params = [];

    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      params.push(department);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { id, full_name, email, department }
    });
  } catch (error) {
    logger.error('Admin update employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

/**
 * Delete an employee
 */
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Perform delete
    await db.query('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    logger.error('Admin delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
});

module.exports = router;
