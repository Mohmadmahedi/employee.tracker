
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'employee_monitoring'
});

async function migrate() {
    try {
        console.log('Altering tamper_alerts table...');
        await pool.query("ALTER TABLE tamper_alerts MODIFY COLUMN alert_type VARCHAR(50) NOT NULL");
        console.log('SUCCESS: alert_type changed to VARCHAR(50)');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e.message);
        process.exit(1);
    }
}
migrate();
