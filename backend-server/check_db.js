const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        process.exit(1);
    }

    connection.query('SHOW TABLES LIKE "recordings"', (error, results) => {
        if (error) throw error;
        if (results.length === 0) {
            console.log('Recordings table missing. Creating it...');
            const createTable = `
        CREATE TABLE recordings (
          id CHAR(36) PRIMARY KEY,
          employee_id CHAR(36) NOT NULL,
          recording_time DATETIME NOT NULL,
          file_path TEXT NOT NULL,
          file_size_kb INT,
          duration_sec INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
            connection.query(createTable, (err2) => {
                if (err2) {
                    console.error('Error creating table:', err2.message);
                    process.exit(1);
                }
                console.log('Recordings table created successfully.');
                connection.end();
            });
        } else {
            console.log('Recordings table already exists.');
            connection.end();
        }
    });
});
