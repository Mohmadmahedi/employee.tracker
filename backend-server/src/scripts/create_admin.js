const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
    console.log('🔄 Connecting to database...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const password = 'Admin@123';
        console.log(`🔐 Hashing password: ${password}`);
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('👤 Creating/Updating admin user...');

        // Check if admin exists
        const [rows] = await pool.execute('SELECT * FROM admin_users WHERE email = ?', ['admin@company.com']);

        if (rows.length > 0) {
            // Update existing
            await pool.execute(
                'UPDATE admin_users SET password_hash = ? WHERE email = ?',
                [hashedPassword, 'admin@company.com']
            );
            console.log('✅ Admin password updated successfully!');
        } else {
            // Insert new
            await pool.execute(
                `INSERT INTO admin_users (id, email, password_hash, full_name, role) 
                 VALUES (UUID(), ?, ?, ?, ?)`,
                ['admin@company.com', hashedPassword, 'System Administrator', 'SUPER_ADMIN']
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📝 CREDENTIALS:');
        console.log('Email:    admin@company.com');
        console.log('Password: Admin@123');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

createAdmin();
