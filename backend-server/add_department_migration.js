
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDepartmentColumn() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        console.log('Checking for department column...');
        const [columns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'department'");

        if (columns.length === 0) {
            console.log('Adding department column...');
            await pool.query("ALTER TABLE employees ADD COLUMN department VARCHAR(100) AFTER email");
            console.log('Successfully added department column.');
        } else {
            console.log('Department column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

addDepartmentColumn();
