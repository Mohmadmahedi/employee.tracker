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
        await db.query(
            `INSERT INTO attendance_sessions (id, employee_id, session_date, state, timestamp, pc_name, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), employeeId, date, status || 'WORKING', formattedTimestamp, pc_name || null, ip_address || req.ip]
        );

        // 2. Update daily attendance summary
        // Check if record exists for today
        const [existing] = await db.query(
            'SELECT id FROM daily_attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, date]
        );

        if (existing) {
            const intervalHours = 5 / 60; // Assuming 5 min heartbeat
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

            updateSql += ' WHERE id = ?';
            params.push(existing.id);

            await db.query(updateSql, params);

            // Calculate overtime
            await db.query(
                'UPDATE daily_attendance SET overtime_hours = CASE WHEN working_hours > 8 THEN working_hours - 8 ELSE 0 END WHERE id = ?',
                [existing.id]
            );
        } else {
            // Create new daily record
            await db.query(
                `INSERT INTO daily_attendance (id, employee_id, attendance_date, login_time, working_hours, break_hours, idle_hours, overtime_hours)
                 VALUES (?, ?, ?, CURRENT_TIME(), ?, 0, 0, 0)`,
                [uuidv4(), employeeId, date, status === 'WORKING' ? 5 / 60 : 0]
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
