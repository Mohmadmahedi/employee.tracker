
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugFilters() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        // 1. Check Schema
        console.log('--- SCHEMA: daily_attendance ---');
        const [columns] = await pool.query('DESCRIBE daily_attendance');
        columns.forEach(col => console.log(`${col.Field}: ${col.Type}`));

        // 2. Test Query with Filters (Simulating Frontend Request)
        const startDate = '2026-01-02';
        const endDate = '2026-01-09';

        console.log(`\n--- TESTING QUERY (${startDate} to ${endDate}) ---`);

        const query = `
            SELECT 
                da.id,
                da.attendance_date,
                e.full_name as employee_name,
                TIMESTAMP(da.attendance_date, da.login_time) as clock_in_time
            FROM daily_attendance da
            JOIN employees e ON da.employee_id = e.id
            WHERE da.attendance_date >= ? AND da.attendance_date <= ?
        `;

        const [rows] = await pool.query(query, [startDate, endDate]);
        console.log(`Rows returned: ${rows.length}`);
        if (rows.length > 0) {
            console.log('First row:', rows[0]);
        } else {
            // Check what dates actually exist
            console.log('No rows. Checking all dates in DB:');
            const [allDates] = await pool.query('SELECT attendance_date FROM daily_attendance');
            console.log(allDates);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

debugFilters();
