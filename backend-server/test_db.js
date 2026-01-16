const mysql = require('mysql2/promise');
require('dotenv').config();

async function runTest() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin123',
            database: process.env.DB_NAME || 'employee_monitoring'
        });

        const tables = ['attendance_sessions', 'daily_attendance', 'recordings', 'employees'];
        for (const table of tables) {
            console.log(`\n=== Table: ${table} ===`);
            const [rows] = await connection.execute(`DESCRIBE ${table}`);
            rows.forEach(row => {
                console.log(`${row.Field}: ${row.Type} (Null: ${row.Null}, Key: ${row.Key})`);
            });
        }
        await connection.end();
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

runTest();
