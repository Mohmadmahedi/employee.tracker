const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * SETTINGS CONTROLLER
 * Admin can control ALL desktop app behavior through these APIs
 */

// Get all global settings
exports.getGlobalSettings = async (req, res) => {
  try {
    const settings = await db.query(
      'SELECT setting_key, setting_value, data_type, description, category FROM global_settings ORDER BY category, setting_key'
    );

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      
      // Parse value based on data type
      let value = setting.setting_value;
      if (setting.data_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.data_type === 'number') {
        value = parseFloat(setting.setting_value);
      } else if (setting.data_type === 'json') {
        value = JSON.parse(setting.setting_value);
      }
      
      acc[setting.category].push({
        key: setting.setting_key,
        value: value,
        type: setting.data_type,
        description: setting.description
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    logger.error('Get global settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

// Update global setting
exports.updateGlobalSetting = async (req, res) => {
  try {
    const { setting_key, setting_value, reason } = req.body;
    const adminId = req.user.id;

    // Get old value for logging
    const [oldSetting] = await db.query(
      'SELECT setting_value, data_type FROM global_settings WHERE setting_key = ?',
      [setting_key]
    );

    if (!oldSetting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    // Convert value to string for storage
    let valueToStore = setting_value;
    if (typeof setting_value === 'boolean') {
      valueToStore = setting_value.toString();
    } else if (typeof setting_value === 'object') {
      valueToStore = JSON.stringify(setting_value);
    } else {
      valueToStore = setting_value.toString();
    }

    // Update setting
    await db.query(
      'UPDATE global_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [valueToStore, adminId, setting_key]
    );

    // Log change history
    await db.query(
      `INSERT INTO config_history (id, config_type, setting_key, old_value, new_value, changed_by, change_reason)
       VALUES (?, 'GLOBAL', ?, ?, ?, ?, ?)`,
      [uuidv4(), setting_key, oldSetting.setting_value, valueToStore, adminId, reason || 'No reason provided']
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (id, actor_type, actor_id, action, entity_type, description)
       VALUES (?, 'ADMIN', ?, 'UPDATE_GLOBAL_SETTING', 'SETTING', ?)`,
      [uuidv4(), adminId, `Changed ${setting_key} from "${oldSetting.setting_value}" to "${valueToStore}"`]
    );

    // Notify all desktop apps via WebSocket
    const io = req.app.get('io');
    io.emit('employee:config-update', {
      type: 'GLOBAL',
      setting_key,
      setting_value: valueToStore
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: {
        setting_key,
        old_value: oldSetting.setting_value,
        new_value: valueToStore
      }
    });

    logger.info(`Admin ${adminId} updated setting: ${setting_key}`);
  } catch (error) {
    logger.error('Update global setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
};

// Bulk update global settings
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings, reason } = req.body; // settings = [{key, value}, ...]
    const adminId = req.user.id;

    await db.transaction(async (connection) => {
      for (const setting of settings) {
        const { key, value } = setting;

        // Get old value
        const [oldSetting] = await connection.execute(
          'SELECT setting_value FROM global_settings WHERE setting_key = ?',
          [key]
        );

        if (oldSetting.length === 0) continue;

        // Convert value
        let valueToStore = value;
        if (typeof value === 'boolean') {
          valueToStore = value.toString();
        } else if (typeof value === 'object') {
          valueToStore = JSON.stringify(value);
        } else {
          valueToStore = value.toString();
        }

        // Update
        await connection.execute(
          'UPDATE global_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
          [valueToStore, adminId, key]
        );

        // Log history
        await connection.execute(
          `INSERT INTO config_history (id, config_type, setting_key, old_value, new_value, changed_by, change_reason)
           VALUES (?, 'GLOBAL', ?, ?, ?, ?, ?)`,
          [uuidv4(), key, oldSetting[0].setting_value, valueToStore, adminId, reason || 'Bulk update']
        );
      }
    });

    // Notify all apps
    const io = req.app.get('io');
    io.emit('employee:config-update', { type: 'GLOBAL_BULK', settings });

    res.json({
      success: true,
      message: `${settings.length} settings updated successfully`
    });
  } catch (error) {
    logger.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

// Get employee-specific settings
exports.getEmployeeSettings = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get all effective settings (employee override + global fallback)
    const settings = await db.query(
      'CALL GetAllEmployeeSettings(?)',
      [employeeId]
    );

    const settingsArray = settings[0];
    
    // Group by category
    const grouped = settingsArray.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }

      let value = setting.setting_value;
      if (setting.data_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.data_type === 'number') {
        value = parseFloat(setting.setting_value);
      } else if (setting.data_type === 'json') {
        value = JSON.parse(setting.setting_value);
      }

      acc[setting.category].push({
        key: setting.setting_key,
        value: value,
        type: setting.data_type,
        is_override: setting.is_override
      });

      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    logger.error('Get employee settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee settings'
    });
  }
};

// Set employee-specific setting (override global)
exports.setEmployeeSetting = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { setting_key, setting_value, data_type, reason } = req.body;
    const adminId = req.user.id;

    // Get current value
    const [current] = await db.query(
      'SELECT setting_value FROM employee_settings WHERE employee_id = ? AND setting_key = ?',
      [employeeId, setting_key]
    );

    // Convert value
    let valueToStore = setting_value;
    if (typeof setting_value === 'boolean') {
      valueToStore = setting_value.toString();
    } else if (typeof setting_value === 'object') {
      valueToStore = JSON.stringify(setting_value);
    } else {
      valueToStore = setting_value.toString();
    }

    if (current) {
      // Update existing override
      await db.query(
        `UPDATE employee_settings 
         SET setting_value = ?, updated_by = ? 
         WHERE employee_id = ? AND setting_key = ?`,
        [valueToStore, adminId, employeeId, setting_key]
      );
    } else {
      // Create new override
      await db.query(
        `INSERT INTO employee_settings (id, employee_id, setting_key, setting_value, data_type, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), employeeId, setting_key, valueToStore, data_type || 'string', adminId]
      );
    }

    // Log change
    await db.query(
      `INSERT INTO config_history (id, config_type, employee_id, setting_key, old_value, new_value, changed_by, change_reason)
       VALUES (?, 'EMPLOYEE_SPECIFIC', ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), employeeId, setting_key, current?.setting_value || 'NULL', valueToStore, adminId, reason || 'No reason']
    );

    // Notify specific employee app
    const io = req.app.get('io');
    io.emit(`employee:${employeeId}:config-update`, {
      type: 'EMPLOYEE_SPECIFIC',
      setting_key,
      setting_value: valueToStore
    });

    res.json({
      success: true,
      message: 'Employee setting updated successfully'
    });

    logger.info(`Admin ${adminId} set employee ${employeeId} setting: ${setting_key}`);
  } catch (error) {
    logger.error('Set employee setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set employee setting'
    });
  }
};

// Remove employee-specific override (revert to global)
exports.removeEmployeeOverride = async (req, res) => {
  try {
    const { employeeId, settingKey } = req.params;
    const adminId = req.user.id;

    await db.query(
      'DELETE FROM employee_settings WHERE employee_id = ? AND setting_key = ?',
      [employeeId, settingKey]
    );

    // Log
    await db.query(
      `INSERT INTO activity_logs (id, actor_type, actor_id, action, entity_type, description)
       VALUES (?, 'ADMIN', ?, 'REMOVE_EMPLOYEE_OVERRIDE', 'SETTING', ?)`,
      [uuidv4(), adminId, `Removed override for ${settingKey} for employee ${employeeId}`]
    );

    // Notify employee
    const io = req.app.get('io');
    io.emit(`employee:${employeeId}:config-update`, {
      type: 'OVERRIDE_REMOVED',
      setting_key: settingKey
    });

    res.json({
      success: true,
      message: 'Employee override removed successfully'
    });
  } catch (error) {
    logger.error('Remove employee override error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove override'
    });
  }
};

// Get config change history
exports.getConfigHistory = async (req, res) => {
  try {
    const { employeeId, limit = 50 } = req.query;

    let query = `
      SELECT ch.*, au.full_name as admin_name, e.full_name as employee_name
      FROM config_history ch
      LEFT JOIN admin_users au ON ch.changed_by = au.id
      LEFT JOIN employees e ON ch.employee_id = e.id
    `;
    
    let params = [];
    if (employeeId) {
      query += ' WHERE ch.employee_id = ? OR ch.config_type = "GLOBAL"';
      params.push(employeeId);
    }
    
    query += ' ORDER BY ch.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const history = await db.query(query, params);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get config history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch config history'
    });
  }
};

// Export settings as JSON (for backup)
exports.exportSettings = async (req, res) => {
  try {
    const globalSettings = await db.query('SELECT * FROM global_settings');
    const employeeSettings = await db.query('SELECT * FROM employee_settings');

    res.json({
      success: true,
      data: {
        exported_at: new Date().toISOString(),
        global_settings: globalSettings,
        employee_settings: employeeSettings
      }
    });
  } catch (error) {
    logger.error('Export settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings'
    });
  }
};

// Import settings from JSON (restore from backup)
exports.importSettings = async (req, res) => {
  try {
    const { global_settings, employee_settings } = req.body;
    const adminId = req.user.id;

    await db.transaction(async (connection) => {
      // Import global settings
      if (global_settings) {
        for (const setting of global_settings) {
          await connection.execute(
            `UPDATE global_settings 
             SET setting_value = ?, updated_by = ? 
             WHERE setting_key = ?`,
            [setting.setting_value, adminId, setting.setting_key]
          );
        }
      }

      // Import employee settings
      if (employee_settings) {
        for (const setting of employee_settings) {
          await connection.execute(
            `INSERT INTO employee_settings (id, employee_id, setting_key, setting_value, data_type, updated_by)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?`,
            [
              setting.id || uuidv4(),
              setting.employee_id,
              setting.setting_key,
              setting.setting_value,
              setting.data_type,
              adminId,
              setting.setting_value,
              adminId
            ]
          );
        }
      }
    });

    // Notify all apps
    const io = req.app.get('io');
    io.emit('employee:config-update', { type: 'IMPORT' });

    res.json({
      success: true,
      message: 'Settings imported successfully'
    });

    logger.info(`Admin ${adminId} imported settings`);
  } catch (error) {
    logger.error('Import settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings'
    });
  }
};

module.exports = exports;
