require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    console.log('Testing connection to:', process.env.DB_HOST);
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });
        const [rows] = await pool.query('SELECT 1 as val');
        console.log('Connected! Result:', rows);
        process.exit(0);
    } catch (e) {
        console.error('Connection failed:', e.message);
        process.exit(1);
    }
}

test();
