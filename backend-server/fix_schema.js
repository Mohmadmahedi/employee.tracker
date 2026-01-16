
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'employee_monitoring'
});

async function fixSchema() {
  try {
    console.log('Adding screenshot_count column to daily_attendance...');
    await pool.query(`
            ALTER TABLE daily_attendance 
            ADD COLUMN screenshot_count INT DEFAULT 0
        `);
    console.log('Schema updated successfully.');
    process.exit(0);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  }
}
fixSchema();
