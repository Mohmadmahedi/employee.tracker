const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Monthly report job - generates summary for each employee and sends email
 */
exports.monthlyReportJob = async () => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    logger.info(`Starting monthly report generation for ${month}/${year}`);

    // Fetch all active employees
    const employees = await db.query('SELECT id, email, full_name FROM employees WHERE is_active = TRUE');

    for (const employee of employees) {
      // Aggregate monthly data
      const [stats] = await db.query(
        `SELECT 
          SUM(working_hours) as total_working,
          SUM(break_hours) as total_break,
          SUM(overtime_hours) as total_overtime,
          COUNT(DISTINCT attendance_date) as days_worked
         FROM daily_attendance 
         WHERE employee_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
        [employee.id, month, year]
      );

      if (!stats || stats.days_worked === 0) continue;

      // Create record in monthly_reports table
      const reportId = uuidv4();
      await db.query(
        `INSERT INTO monthly_reports 
         (id, employee_id, report_month, report_year, total_working_hours, total_break_hours, total_overtime_hours, days_worked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         total_working_hours = VALUES(total_working_hours),
         total_break_hours = VALUES(total_break_hours),
         total_overtime_hours = VALUES(total_overtime_hours),
         days_worked = VALUES(days_worked)`,
        [reportId, employee.id, month, year, stats.total_working || 0, stats.total_break || 0, stats.total_overtime || 0, stats.days_worked || 0]
      );

      // Send email
      const { sendMonthlyReportEmail } = require('./email.service');
      const emailSent = await sendMonthlyReportEmail(employee, stats, month, year);

      logger.info(`Generated monthly report for ${employee.full_name}`);
    }

    logger.info('Monthly report job completed successfully');
  } catch (error) {
    logger.error('Monthly report job error:', error);
  }
};
