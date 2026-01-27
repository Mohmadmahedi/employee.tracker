const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend-server/.env' });

async function setupRecordingsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_NAME || 'employee_monitoring'
    });

    try {
        console.log('Checking recordings table...');
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS recordings (
        id CHAR(36) PRIMARY KEY,
        employee_id CHAR(36) NOT NULL,
        recording_time DATETIME NOT NULL,
        file_path TEXT NOT NULL,
        file_size_kb INT,
        duration_sec INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log('Recordings table is ready.');
    } catch (error) {
        console.error('Error setting up recordings table:', error.message);
    } finally {
        await connection.end();
    }
}

setupRecordingsTable();
