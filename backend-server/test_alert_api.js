
// Axios removed, using fetch

const jwt = require('jsonwebtoken');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    // 1. Get an employee
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    const [employees] = await pool.query('SELECT * FROM employees LIMIT 1');
    if (employees.length === 0) {
        console.log('No employees found. Cannot test.');
        process.exit(1);
    }
    const employee = employees[0];
    console.log('Using employee:', employee.email);

    // 2. Generate Token
    const payload = {
        id: employee.id,
        email: employee.email,
        type: 'employee'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

    // 3. Post Alert
    try {
        console.log('Posting alert...');
        const res = await fetch('http://localhost:5000/api/alerts/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                alert_type: 'TEST_ALERT',
                action_attempted: 'Running Node Script',
                details: 'This is a test alert'
            })
        });
        const data = await res.json();
        console.log('Post response:', data);
    } catch (e) {
        console.error('Post failed:', e.message);
    }

    // 4. Verify in DB
    const [alerts] = await pool.query('SELECT * FROM tamper_alerts WHERE alert_type = "TEST_ALERT" ORDER BY alert_time DESC LIMIT 1');
    console.log('DB Alert:', alerts[0]);

    if (alerts.length > 0) {
        console.log('VERIFICATION SUCCESSFUL');
    } else {
        console.log('VERIFICATION FAILED');
    }
    process.exit(0);
}
test();
