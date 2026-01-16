
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'employee_monitoring'
});

async function checkAlerts() {
    try {
        const [tables] = await pool.query("SHOW TABLES LIKE 'tamper_alerts'");
        if (tables.length === 0) {
            console.log('tamper_alerts table DOES NOT exist.');
        } else {
            console.log('tamper_alerts table EXISTS.');
            const [rows] = await pool.query("SHOW CREATE TABLE tamper_alerts");
            console.log(rows[0]['Create Table']);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkAlerts();
