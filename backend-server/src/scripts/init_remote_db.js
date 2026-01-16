// scripts/init_remote_db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('=== Remote Database Initializer ===');
    console.log('This script will help you initialize your Aiven database.\n');

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
            ssl: { rejectUnauthorized: false }, // Required for Aiven
            multipleStatements: true
        });

        console.log('✓ Connected successfully!');

        // Read schema file
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        console.log(`\nReading schema from: ${schemaPath}`);

        let schema = fs.readFileSync(schemaPath, 'utf8');

        // REMOVE CREATE DATABASE and USE commands to ensure we use the Aiven defaultdb
        // This prevents creating a separate 'employee_monitoring' DB that the app won't use
        schema = schema.replace(/CREATE DATABASE.*;/g, '');
        schema = schema.replace(/USE employee_monitoring;/g, '');

        console.log('Executing schema statements...');

        // Split file into Tables and Procedures
        const parts = schema.split('DELIMITER //');

        // Part 1: Tables and Views (Standard SQL)
        if (parts.length > 0) {
            console.log('Creating Tables and Views...');
            // Split by semicolon, filter empty statements
            const statements = parts[0].split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const sql of statements) {
                try {
                    // Attempt to modify for idempotency
                    let finalSql = sql;
                    if (finalSql.toUpperCase().startsWith('CREATE TABLE')) {
                        finalSql = finalSql.replace(/CREATE TABLE/i, 'CREATE TABLE IF NOT EXISTS');
                    }
                    if (finalSql.toUpperCase().startsWith('CREATE VIEW')) {
                        finalSql = finalSql.replace(/CREATE VIEW/i, 'CREATE OR REPLACE VIEW');
                    }

                    await connection.query(finalSql);
                    // console.log('  - Executed statement');
                } catch (e) {
                    // Ignore "Table exists" and "View exists" related errors
                    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.errno === 1050) {
                        // console.log('  - Exists, skipping');
                    } else {
                        console.error(`  ❌ Error executing statement: ${e.message}`);
                        console.error(`     Statement preview: ${sql.substring(0, 50)}...`);
                    }
                }
            }
        }

        // Part 2: Stored Procedures
        if (parts.length > 1) {
            console.log('Creating Stored Procedures...');
            const proceduresBlock = parts[1].split('DELIMITER ;')[0];

            const procedures = proceduresBlock.split('//')
                .map(p => p.trim())
                .filter(p => p.length > 0);

            for (const proc of procedures) {
                try {
                    // Stored procedures are harder to check "IF EXISTS", so we just catch error
                    await connection.query(proc);
                } catch (err) {
                    if (err.code === 'ER_SP_ALREADY_EXISTS' || err.errno === 1304) {
                        // already exists, ignore
                    } else {
                        console.error(`  Warning creating procedure: ${err.message}`);
                    }
                }
            }
        }

        console.log('✓ Schema executed successfully!');
        console.log('\nYour Aiven database is now ready with all tables!');

        await connection.end();
    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
    } finally {
        rl.close();
    }
}

main();
