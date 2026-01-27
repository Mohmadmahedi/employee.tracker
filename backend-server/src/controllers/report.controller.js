const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get daily attendance report with filters
 */
exports.getAttendanceReport = async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;
        console.log('Report Request Params:', { employeeId, startDate, endDate });

        let query = `
            SELECT 
                da.id,
                da.attendance_date,
                e.full_name as employee_name,
                e.department,
                TIMESTAMP(da.attendance_date, da.login_time) as clock_in_time,
                CASE 
                    WHEN da.logout_time IS NOT NULL THEN TIMESTAMP(da.attendance_date, da.logout_time)
                    ELSE da.updated_at 
                END as clock_out_time,
                (COALESCE(da.working_hours, 0) + COALESCE(da.idle_hours, 0) + COALESCE(da.break_hours, 0)) as working_hours,
                CASE 
                    WHEN TIME(da.login_time) > '09:30:00' THEN 'Late' 
                    ELSE 'On Time' 
                END as late_status,
                da.screenshot_count
            FROM daily_attendance da
            JOIN employees e ON da.employee_id = e.id
            WHERE 1=1
        `;

        const params = [];

        if (employeeId && employeeId !== 'all') {
            query += ' AND da.employee_id = ?';
            params.push(employeeId);
        }

        if (startDate) {
            query += ' AND da.attendance_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND da.attendance_date <= ?';
            params.push(endDate + ' 23:59:59');
        }

        query += ' ORDER BY da.attendance_date DESC, da.login_time DESC';

        console.log('Executing Report Query:', query);
        console.log('Query Params:', params);

        const rows = await db.query(query, params);
        console.log('Rows found:', rows.length);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Report Error:', error);
        logger.error('Report Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance report'
        });
    }
};

/**
 * Get summary statistics for dashboard cards
 */
exports.getSummaryStats = async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;
        let params = [];
        let whereClause = 'WHERE 1=1';

        if (employeeId && employeeId !== 'all') {
            whereClause += ' AND employee_id = ?';
            params.push(employeeId);
        }
        if (startDate) {
            whereClause += ' AND attendance_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND attendance_date <= ?';
            params.push(endDate + ' 23:59:59');
        }

        // Query for aggregated stats
        const query = `
            SELECT 
                COUNT(*) as present_days,
                SUM(COALESCE(working_hours, 0) + COALESCE(idle_hours, 0) + COALESCE(break_hours, 0)) as total_hours,
                SUM(CASE WHEN TIME(login_time) > '09:30:00' THEN 1 ELSE 0 END) as late_days
            FROM daily_attendance
            ${whereClause}
        `;

        const rows = await db.query(query, params);
        const stats = rows[0];

        res.json({
            success: true,
            data: {
                present_days: stats ? stats.present_days : 0,
                total_hours: stats ? Math.round((stats.total_hours || 0) * 10) / 10 : 0,
                late_days: stats ? Number(stats.late_days) : 0
            }
        });
    } catch (error) {
        logger.error('Get summary stats error:', error);
        try {
            require('fs').appendFileSync('backend_error.log', `[${new Date().toISOString()}] Report Summary Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) { }
        res.status(500).json({ success: false, message: 'Failed to fetch summary stats' });
    }
};
