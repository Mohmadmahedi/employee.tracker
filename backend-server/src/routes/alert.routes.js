const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// Routes requiring authentication
router.use(authenticate);

/**
 * Report a security alert (accessible by employees and system)
 */
router.post('/report', async (req, res) => {
  try {
    const { alert_type, action_attempted, details } = req.body;
    const employeeId = req.user.id;
    const { v4: uuidv4 } = require('uuid');

    await db.query(
      `INSERT INTO tamper_alerts (id, employee_id, alert_type, action_attempted, status, alert_time, admin_notes)
       VALUES (?, ?, ?, ?, 'PENDING', NOW(), ?)`,
      [uuidv4(), employeeId, alert_type, action_attempted, details || null]
    );

    res.json({
      success: true,
      message: 'Alert reported successfully'
    });
  } catch (error) {
    logger.error('Report alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to report alert', error: error.message });
  }
});

// Admin-only routes
router.use(isAdmin);

/**
 * Get all tamper alerts with employee details
 */
router.get('/list', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ta.*, e.full_name, e.email 
      FROM tamper_alerts ta
      JOIN employees e ON ta.employee_id = e.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE ta.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ta.alert_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const alerts = await db.query(query, params);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

/**
 * Update alert status (review)
 */
router.patch('/:id/review', async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const { id } = req.params;
    const adminId = req.user.id;

    await db.query(
      `UPDATE tamper_alerts 
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), admin_notes = ?
       WHERE id = ?`,
      [status, adminId, admin_notes, id]
    );

    res.json({
      success: true,
      message: 'Alert reviewed successfully'
    });
  } catch (error) {
    logger.error('Review alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to review alert' });
  }
});

/**
 * Delete an alert
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM tamper_alerts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Delete alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete alert' });
  }
});

/**
 * Bulk delete alerts
 */
router.post('/delete-batch', async (req, res) => {
  try {
    const { ids } = req.body;
    logger.info(`Bulk delete request for ${ids?.length} alerts:`, ids);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No alert IDs provided' });
    }

    const result = await db.query('DELETE FROM tamper_alerts WHERE id IN (?)', [ids]);
    logger.info('Bulk delete result:', result);

    res.json({
      success: true,
      message: `${result.affectedRows} alerts deleted successfully`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    logger.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete alerts' });
  }
});

module.exports = router;
