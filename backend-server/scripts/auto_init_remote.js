
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log('=== Auto Remote Database Initializer ===');
    console.log(`Connecting to ${process.env.DB_HOST}...`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false },
            multipleStatements: true
        });

        console.log('✓ Connected successfully!');

        // Read schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        console.log(`\nReading schema from: ${schemaPath}`);

        let schema = fs.readFileSync(schemaPath, 'utf8');

        // REMOVE CREATE DATABASE and USE commands
        schema = schema.replace(/CREATE DATABASE.*;/g, '');
        schema = schema.replace(/USE employee_monitoring;/g, '');

        console.log('Executing schema statements...');

        const parts = schema.split('DELIMITER //');

        // Part 1: Tables and Views
        if (parts.length > 0) {
            console.log('Creating Tables and Views...');
            const statements = parts[0].split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const sql of statements) {
                try {
                    let finalSql = sql;
                    if (finalSql.toUpperCase().startsWith('CREATE TABLE')) {
                        finalSql = finalSql.replace(/CREATE TABLE/i, 'CREATE TABLE IF NOT EXISTS');
                    }
                    if (finalSql.toUpperCase().startsWith('CREATE VIEW')) {
                        finalSql = finalSql.replace(/CREATE VIEW/i, 'CREATE OR REPLACE VIEW');
                    }
                    await connection.query(finalSql);
                } catch (e) {
                    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.errno === 1050) {
                        // ignore
                    } else {
                        console.error(`  ❌ Error: ${e.message}`);
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
                    // Extract name to drop it first
                    const match = proc.match(/CREATE PROCEDURE\s+`?(\w+)`?/i);
                    if (match) {
                        await connection.query(`DROP PROCEDURE IF EXISTS ${match[1]}`);
                    }
                    await connection.query(proc);
                } catch (e) {
                    console.error(`  ❌ Error creating procedure: ${e.message}`);
                }
            }
        }

        console.log('✓ Database initialized successfully!');
        await connection.end();
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

main();
