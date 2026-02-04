const db = require('./src/config/database');

async function checkTables() {
    try {
        console.log('--- EMPLOYEES ---');
        const [employees] = await db.query('DESCRIBE employees');
        console.table(employees);

        console.log('--- DAILY_ATTENDANCE ---');
        const [attendance] = await db.query('DESCRIBE daily_attendance');
        console.table(attendance);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
