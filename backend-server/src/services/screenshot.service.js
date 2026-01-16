const db = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Cleanup old screenshots based on retention settings
 */
exports.cleanupOldScreenshots = async () => {
  try {
    // Get retention days from settings
    const [setting] = await db.query(
      "SELECT setting_value FROM global_settings WHERE setting_key = 'screenshot_retention_days'"
    );
    const retentionDays = parseInt(setting?.setting_value || '90');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info(`Cleaning up screenshots older than ${retentionDays} days (${cutoffDate.toISOString()})`);

    // Find screenshots to delete
    const oldScreenshots = await db.query(
      'SELECT id, file_path FROM screenshots WHERE screenshot_time < ?',
      [cutoffDate]
    );

    for (const screenshot of oldScreenshots) {
      if (screenshot.file_path) {
        try {
          const fullPath = path.resolve(screenshot.file_path);
          await fs.unlink(fullPath);
        } catch (err) {
          logger.error(`Failed to delete file: ${screenshot.file_path}`, err);
        }
      }

      await db.query('DELETE FROM screenshots WHERE id = ?', [screenshot.id]);
    }

    logger.info(`Cleaned up ${oldScreenshots.length} old screenshots`);
  } catch (error) {
    logger.error('Screenshot cleanup error:', error);
  }
};

/**
 * Save screenshot metadata to database
 */
exports.saveScreenshotMetadata = async (data) => {
  try {
    const { id, employeeId, screenshotTime, filePath, fileSizeKb } = data;

    await db.query(
      `INSERT INTO screenshots (id, employee_id, screenshot_time, file_path, file_size_kb)
       VALUES (?, ?, ?, ?, ?)`,
      [id, employeeId, screenshotTime, filePath, fileSizeKb]
    );

    // Increment screenshot count for daily summary
    const date = screenshotTime.split(' ')[0];
    await db.query(
      `UPDATE daily_attendance 
       SET screenshot_count = screenshot_count + 1 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, date]
    );

    return true;
    return true;
  } catch (error) {
    logger.error('Save screenshot metadata error:', error);
    try {
      require('fs').appendFileSync('backend_error.log', `[${new Date().toISOString()}] Screenshot Error: ${error.message}\nStack: ${error.stack}\n`);
    } catch (e) { }
    throw error; // Throw so controller knows it failed
  }
};
