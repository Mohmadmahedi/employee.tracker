const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend-server/.env' });

async function checkEmployees() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        const [rows] = await connection.execute('SELECT email, full_name, is_active FROM employees');
        console.log('Employees in database:');
        console.table(rows);
    } catch (error) {
        console.error('Error querying employees:', error.message);
    } finally {
        await connection.end();
    }
}

checkEmployees();
