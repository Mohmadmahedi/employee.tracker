const db = require('./src/config/database');

async function checkTables() {
    try {
        console.log('--- DB OBJECT ---');
        // console.log(db);

        console.log('--- EMPLOYEES QUERY ---');
        const result = await db.query('SHOW COLUMNS FROM employees');
        console.log('Result type:', typeof result);
        console.log('Result isArray:', Array.isArray(result));
        if (Array.isArray(result)) {
            console.log('Length:', result.length);
            console.log('First item:', result[0]);
        } else {
            console.log('Result keys:', Object.keys(result));
            console.log('Result:', result);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
