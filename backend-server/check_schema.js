
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'employee_monitoring'
});

async function checkSchema() {
    try {
        const [screenshotsCols] = await pool.query('DESCRIBE screenshots');
        console.log('--- SCREENSHOTS TABLE ---');
        console.table(screenshotsCols);

        const [dailyCols] = await pool.query('DESCRIBE daily_attendance');
        console.log('--- DAILY_ATTENDANCE TABLE ---');
        console.table(dailyCols);

        // Check recent daily attendance records
        const [rows] = await pool.query('SELECT * FROM daily_attendance ORDER BY created_at DESC LIMIT 5');
        console.log('--- RECENT DAILY ATTENDANCE ---');
        console.log(rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
