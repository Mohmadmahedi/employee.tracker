const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
require('dotenv').config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' or configure host/port for other providers
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
    },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {Array} attachments - Optional attachments array
 */
exports.sendEmail = async (to, subject, html, attachments = []) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            logger.warn('Email credentials missing. Skipping email send.');
            return false;
        }

        const info = await transporter.sendMail({
            from: `"Attendance System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        });

        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        logger.error('Error sending email:', error);
        return false;
    }
};

/**
 * Send monthly report email
 */
exports.sendMonthlyReportEmail = async (employee, stats, month, year) => {
    const subject = `Monthly Attendance Report - ${month}/${year}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Monthly Attendance Summary</h2>
        <p>Dear ${employee.full_name},</p>
        <p>Here is your attendance summary for <strong>${month}/${year}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Working Hours</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${stats.total_working ? parseFloat(stats.total_working).toFixed(2) : '0.00'} hrs</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Break Time</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${stats.total_break ? parseFloat(stats.total_break).toFixed(2) : '0.00'} hrs</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Overtime</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: ${stats.total_overtime > 0 ? 'green' : 'black'};">
              ${stats.total_overtime ? parseFloat(stats.total_overtime).toFixed(2) : '0.00'} hrs
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Days Worked</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${stats.days_worked}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          You can view detailed daily logs in your 
          <a href="${employee.google_sheet_url || '#'}" style="color: #007bff; text-decoration: none;">Google Sheet</a>.
        </p>
        
        <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">
          This is an automated message. Please do not reply.
        </p>
      </div>
    `;

    return await exports.sendEmail(employee.email, subject, html);
};
