const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Starting migration: Creating recordings table...');

        const sql = `
            CREATE TABLE IF NOT EXISTS recordings (
                id CHAR(36) PRIMARY KEY,
                employee_id CHAR(36) NOT NULL,
                recording_time DATETIME NOT NULL,
                file_path VARCHAR(500),
                file_size_kb INT,
                duration_sec INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                INDEX idx_employee_time (employee_id, recording_time DESC),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.query(sql);
        console.log('✓ Recordings table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
