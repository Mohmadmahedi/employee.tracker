const jwt = require('jsonwebtoken');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testLargeBulkDelete() {
    console.log('Starting Large Bulk Delete Alert Test...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        // 1. Setup tokens
        const [employees] = await pool.query('SELECT * FROM employees LIMIT 1');
        const [admins] = await pool.query('SELECT * FROM admin_users LIMIT 1');
        const employee = employees[0];
        const admin = admins[0];

        const empToken = jwt.sign({ id: employee.id, email: employee.email, type: 'employee' }, process.env.JWT_SECRET || 'your-secret-key');
        const adminToken = jwt.sign({ id: admin.id, email: admin.email, type: 'admin' }, process.env.JWT_SECRET || 'your-secret-key');

        // 2. Create 50 Alerts
        console.log('Creating 50 test alerts...');
        const createdIds = [];
        // We'll insert directly to DB for speed, instead of API calls one by one
        const { v4: uuidv4 } = require('uuid');

        const placeholders = [];
        const values = [];
        for (let i = 0; i < 50; i++) {
            const id = uuidv4();
            createdIds.push(id);
            placeholders.push('(?, ?, ?, ?, ?, NOW())');
            values.push(id, employee.id, 'TEST_LARGE_BATCH', `Batch Item ${i}`, 'PENDING');
        }

        await pool.query(
            `INSERT INTO tamper_alerts (id, employee_id, alert_type, action_attempted, status, alert_time) VALUES ${placeholders.join(', ')}`,
            values
        );
        console.log('Created 50 alerts.');

        // 3. Bulk Delete via API
        console.log('Bulk deleting 50 alerts API...');
        const deleteRes = await fetch('http://localhost:5000/api/alerts/delete-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ ids: createdIds })
        });
        const deleteData = await deleteRes.json();
        console.log('Delete response:', deleteData);

        if (!deleteData.success) {
            throw new Error('Bulk Delete API failed: ' + deleteData.message);
        }

        // 4. Verify
        const [remaining] = await pool.query('SELECT count(*) as count FROM tamper_alerts WHERE alert_type = "TEST_LARGE_BATCH"');
        if (remaining[0].count === 0) {
            console.log('VERIFICATION SUCCESSFUL: 50 alerts deleted.');
        } else {
            console.error(`VERIFICATION FAILED: ${remaining[0].count} alerts remain.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testLargeBulkDelete();
