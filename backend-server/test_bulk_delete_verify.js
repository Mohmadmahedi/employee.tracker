const mysql = require('mysql2/promise');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function runTest() {
    let connection;
    try {
        // 1. Connect to DB
        console.log('Connecting to database...');
        connection = await mysql.createConnection(DB_CONFIG);

        // 2. Get an employee ID
        const [employees] = await connection.execute('SELECT id FROM employees LIMIT 1');
        if (employees.length === 0) {
            console.error('No employees found to create alerts for.');
            return;
        }
        const employeeId = employees[0].id;

        // 3. Create 3 test alerts
        console.log(`Creating 3 test alerts for employee ${employeeId}...`);
        const alertIds = [];
        for (let i = 0; i < 3; i++) {
            const id = require('crypto').randomUUID();
            await connection.execute(
                `INSERT INTO tamper_alerts (id, employee_id, alert_type, action_attempted, status, alert_time) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
                [id, employeeId, 'TEST_BULK_DELETE', 'Running Test Script', 'PENDING']
            );
            alertIds.push(id);
        }
        console.log('Created alerts:', alertIds);

        // 4. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@admin.com',
                password: 'admin'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // 5. Bulk Delete
        console.log('Sending bulk delete request...');
        const deleteRes = await fetch(`${API_URL}/alerts/delete-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids: alertIds })
        });

        const deleteData = await deleteRes.json();
        console.log('Delete Response:', deleteData);

        if (deleteData.deletedCount === 3) {
            console.log('SUCCESS: Verified 3 alerts deleted.');
        } else {
            console.error('FAILURE: Expected 3 deleted, got:', deleteData.deletedCount);
            process.exit(1);
        }

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runTest();
