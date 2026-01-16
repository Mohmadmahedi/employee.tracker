
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'employee_monitoring'
});

async function check() {
    console.log('Waiting for alerts...');
    const start = Date.now();
    while (Date.now() - start < 90000) { // Wait up to 90 seconds
        const [rows] = await pool.query("SELECT * FROM tamper_alerts WHERE alert_type = 'RESTRICTED_APP_DETECTED' ORDER BY alert_time DESC LIMIT 1");
        if (rows.length > 0) {
            console.log('SUCCESS: Alert found!');
            console.log(rows[0]);
            process.exit(0);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log('TIMEOUT: No alert found after 90 seconds.');
    process.exit(1);
}
check();
