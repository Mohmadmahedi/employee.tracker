const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        console.log('--- Database Check ---');

        // Check Employees
        const [employees] = await connection.execute('SELECT id, email, full_name, is_active FROM employees');
        console.log('\n--- Employees ---');
        console.table(employees);

        // Check Tamper Alerts
        const [alerts] = await connection.execute('SELECT * FROM tamper_alerts ORDER BY created_at DESC LIMIT 5');
        console.log('\n--- Tamper Alerts ---');
        if (alerts.length === 0) {
            console.log('No alerts found (Expected if no tampering).');
        } else {
            console.table(alerts);
        }

        // Check Screenshots
        const [screenshots] = await connection.execute('SELECT id, employee_id, screenshot_time, file_path FROM screenshots ORDER BY created_at DESC LIMIT 5');
        console.log('\n--- Recent Screenshots in DB ---');
        if (screenshots.length === 0) {
            console.log('No screenshots found in DB.');
        } else {
            console.table(screenshots);
        }

    } catch (error) {
        console.error('Error verifying data:', error.message);
    } finally {
        await connection.end();
    }
}

verifyData();
