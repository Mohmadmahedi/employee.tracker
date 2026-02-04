const db = require('./src/config/database');

async function checkTables() {
    try {
        console.log('--- EMPLOYEES ---');
        const employees = await db.query('SHOW COLUMNS FROM employees');
        console.log(JSON.stringify(employees.map(c => c.Field), null, 2));

        console.log('--- DAILY_ATTENDANCE ---');
        const attendance = await db.query('SHOW COLUMNS FROM daily_attendance');
        console.log(JSON.stringify(attendance.map(c => c.Field), null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
