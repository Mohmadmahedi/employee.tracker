const { google } = require('googleapis');
const logger = require('../utils/logger');
const db = require('../config/database');

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Create a new Google Sheet for an employee
 */
exports.createEmployeeSheet = async (employeeId, employeeName) => {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      logger.warn('Google Sheets credentials missing. Skipping sheet creation.');
      return null;
    }

    const resource = {
      properties: {
        title: `Attendance - ${employeeName} (${employeeId.substring(0, 8)})`,
      },
    };

    const spreadsheet = await sheets.spreadsheets.create({
      resource,
      fields: 'spreadsheetId,spreadsheetUrl',
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

    // Initialize headers
    const headers = [['Date', 'Login Time', 'Logout Time', 'Working Hours', 'Break Hours', 'Overtime', 'Status']];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:G1',
      valueInputOption: 'RAW',
      resource: { values: headers },
    });

    // Update database with sheet info
    await db.query(
      'UPDATE employees SET google_sheet_id = ?, google_sheet_url = ? WHERE id = ?',
      [spreadsheetId, spreadsheetUrl, employeeId]
    );

    logger.info(`Created Google Sheet for ${employeeName}: ${spreadsheetUrl}`);
    return { spreadsheetId, spreadsheetUrl };
  } catch (error) {
    logger.error('Create employee sheet error:', error);
    // Don't throw, just log. We don't want to break login if sheets fail.
    return null;
  }
};

/**
 * Sync daily attendance data to Google Sheets
 */
exports.syncDailyAttendance = async (employeeId, date) => {
  try {
    // Fetch employee sheet info
    const [employee] = await db.query(
      'SELECT google_sheet_id, full_name FROM employees WHERE id = ?',
      [employeeId]
    );

    if (!employee || !employee.google_sheet_id) {
      return;
    }

    // Fetch daily summary
    const [attendance] = await db.query(
      'SELECT * FROM daily_attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, date]
    );

    if (!attendance) return;

    const values = [[
      date,
      attendance.login_time || '-',
      attendance.logout_time || '-',
      attendance.working_hours,
      attendance.break_hours,
      attendance.overtime_hours,
      'COMPLETE'
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: employee.google_sheet_id,
      range: 'Sheet1!A:G',
      valueInputOption: 'RAW',
      resource: { values },
    });

    // Mark as synced
    await db.query(
      'UPDATE daily_attendance SET synced_to_sheets = TRUE, synced_at = NOW() WHERE id = ?',
      [attendance.id]
    );

    logger.info(`Synced attendance to Google Sheet for ${employee.full_name} on ${date}`);
  } catch (error) {
    logger.error('Sync daily attendance error:', error);
  }
};
