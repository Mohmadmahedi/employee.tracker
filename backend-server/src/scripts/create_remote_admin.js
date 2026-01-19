const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('=== Remote Admin User Creator ===');
    console.log('This script will create the default admin user in your remote database.\n');

    try {
        // Collect DB details
        const host = await question('Enter Aiven DB Host (e.g., mysql-xxx...): ');
        const port = await question('Enter Aiven DB Port (e.g., 21409): ');
        const user = await question('Enter Aiven DB User (usually avnadmin): ');
        const password = await question('Enter Aiven DB Password: ');
        const database = await question('Enter Database Name (defaultdb): ');

        console.log('\nConnecting to database...');

        const connection = await mysql.createConnection({
            host: host.trim(),
            port: parseInt(port.trim()),
            user: user.trim(),
            password: password.trim(),
            database: database.trim(),
            ssl: { rejectUnauthorized: false }
        });

        console.log('✓ Connected successfully!');

        const adminEmail = 'admin@company.com';
        const adminPassword = 'Admin@123';

        console.log(`\nCreating admin user: ${adminEmail} ...`);

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if admin exists
        const [rows] = await connection.execute('SELECT * FROM admin_users WHERE email = ?', [adminEmail]);

        if (rows.length > 0) {
            // Update existing
            await connection.execute(
                'UPDATE admin_users SET password_hash = ? WHERE email = ?',
                [hashedPassword, adminEmail]
            );
            console.log('✅ Admin user exists. Password updated successfully!');
        } else {
            // Insert new
            await connection.execute(
                `INSERT INTO admin_users (id, email, password_hash, full_name, role) 
                 VALUES (UUID(), ?, ?, ?, ?)`,
                [adminEmail, hashedPassword, 'System Administrator', 'SUPER_ADMIN']
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📝 LOGIN CREDENTIALS:');
        console.log('Email:    admin@company.com');
        console.log('Password: Admin@123');
        console.log('\nYou can now login with these credentials in the desktop app.');

        await connection.end();
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

main();
