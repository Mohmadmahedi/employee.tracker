
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log('=== Create Remote Admin ===');
    console.log(`Connecting to ${process.env.DB_HOST}...`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✓ Connected successfully!');

        const adminEmail = 'admin@company.com';
        const plainPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Check if admin exists
        const [rows] = await connection.execute('SELECT * FROM admin_users WHERE email = ?', [adminEmail]);

        if (rows.length > 0) {
            console.log('⚠ Admin user already exists. Updating password...');
            await connection.execute(
                'UPDATE admin_users SET password_hash = ? WHERE email = ?',
                [hashedPassword, adminEmail]
            );
            console.log('✓ Admin password updated.');
        } else {
            console.log('Creating new admin user...');
            await connection.execute(
                `INSERT INTO admin_users (id, email, password_hash, full_name, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                [uuidv4(), adminEmail, hashedPassword, 'System Administrator', 'SUPER_ADMIN']
            );
            console.log('✓ Admin user created successfully.');
        }

        console.log('\n-----------------------------------');
        console.log('Login Credentials:');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${plainPassword}`);
        console.log('-----------------------------------\n');

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
