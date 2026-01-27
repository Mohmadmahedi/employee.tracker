const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend-server/.env' });

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        const tables = ['attendance_sessions', 'daily_attendance', 'recordings'];
        for (const table of tables) {
            console.log(`--- Schema for ${table} ---`);
            const [rows] = await connection.execute(`DESCRIBE ${table}`);
            console.table(rows);
        }
    } catch (error) {
        console.error('Error checking schema:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
