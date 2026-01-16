
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        console.log('Testing connection...');
        await pool.query('SELECT 1');
        console.log('Connection successful.');

        const query = `
            SELECT 
                da.id,
                da.attendance_date,
                e.full_name as employee_name,
                TIMESTAMP(da.attendance_date, da.login_time) as clock_in_time,
                da.updated_at as clock_out_time,
                da.working_hours,
                CASE 
                    WHEN TIME(da.login_time) > '09:30:00' THEN 'Late' 
                    ELSE 'On Time' 
                END as late_status,
                da.screenshot_count
            FROM daily_attendance da
            JOIN employees e ON da.employee_id = e.id
            WHERE 1=1
            ORDER BY da.attendance_date DESC, da.login_time DESC
        `;

        console.log('Executing query...');
        const [rows] = await pool.query(query);
        console.log('Query successful. Rows returned:', rows.length);
        if (rows.length > 0) {
            console.log('First row:', rows[0]);
        }
    } catch (error) {
        console.error('Query failed!');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('SQL State:', error.sqlState);
    } finally {
        await pool.end();
    }
}

testQuery();
