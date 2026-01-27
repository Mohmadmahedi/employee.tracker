const db = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle employee heartbeat
 * Updates current session and daily summary
 */
exports.heartbeat = async (req, res) => {
    try {
        const { status, timestamp, pc_name, ip_address } = req.body;
        const employeeId = req.user.id;

        // Format dates correctly for MySQL
        const now = new Date(timestamp || Date.now());
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedTimestamp = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS

        // 1. Record the heartbeat session
        // Map 'OFF' to 'OFF' (which we added to the ENUM in the migration script)
        const dbStatus = status === 'OFF' ? 'OFF' : (status || 'WORKING');

        await db.query(
            `INSERT INTO attendance_sessions (id, employee_id, session_date, state, timestamp, pc_name, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), employeeId, date, dbStatus, formattedTimestamp, pc_name || null, ip_address || req.ip]
        );

        // 2. Update daily attendance summary
        // Check if record exists for today
        const [existing] = await db.query(
            'SELECT id FROM daily_attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, date]
        );

        if (existing) {
            // Calculate actual interval since last update to be precise
            // Default to 5 mins if no updated_at exists yet
            const lastUpdate = new Date(existing.updated_at || existing.login_time || Date.now());
            const diffMs = now - lastUpdate;
            const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

            // Limit interval to 15 mins to prevent huge jumps if PC was asleep
            const intervalHours = Math.min(diffHours, 0.25);

            let updateSql = 'UPDATE daily_attendance SET updated_at = NOW()';
            const params = [];

            if (status === 'WORKING') {
                updateSql += ', working_hours = COALESCE(working_hours, 0) + ?';
                params.push(intervalHours);
            } else if (status === 'BREAK') {
                updateSql += ', break_hours = COALESCE(break_hours, 0) + ?';
                params.push(intervalHours);
            } else if (status === 'IDLE') {
                updateSql += ', idle_hours = COALESCE(idle_hours, 0) + ?';
                params.push(intervalHours);
            }

            if (status === 'OFF') {
                updateSql += ', logout_time = CURRENT_TIME()';
            }

            updateSql += ' WHERE id = ?';
            params.push(existing.id);

            await db.query(updateSql, params);
        } else {
            // Create new daily record
            await db.query(
                `INSERT INTO daily_attendance (id, employee_id, attendance_date, login_time, updated_at, working_hours, break_hours, idle_hours, overtime_hours)
                 VALUES (?, ?, ?, CURRENT_TIME(), NOW(), ?, 0, 0, 0)`,
                [uuidv4(), employeeId, date, status === 'WORKING' ? 0.01 : 0] // Start with 30 seconds worth for first heartbeat
            );
        }

        // 3. Update employee last seen
        await db.query(
            'UPDATE employees SET last_seen = NOW(), pc_name = ? WHERE id = ?',
            [pc_name || null, employeeId]
        );

        res.json({
            success: true,
            message: 'Heartbeat processed'
        });
    } catch (error) {
        console.error('CRITICAL Heartbeat error:', error);
        logger.error('Heartbeat error:', error);

        // Handle foreign key constraint error (User not found)
        if (error.errno === 1452) {
            return res.status(401).json({
                success: false,
                message: 'Invalid employee ID',
                shouldLogout: true
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during heartbeat',
            error: error.message
        });
    }
};

/**
 * Get daily stats for an employee
 */
exports.getDailyStats = async (req, res) => {
    try {
        const { date } = req.params;
        const employeeId = req.user.id;

        const [stats] = await db.query(
            'SELECT * FROM daily_attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, date]
        );

        res.json({
            success: true,
            data: stats || null
        });
    } catch (error) {
        logger.error('Get daily stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
};
