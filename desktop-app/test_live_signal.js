const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://attendance-backend-7yn8.onrender.com/api';
const SOCKET_URL = 'https://attendance-backend-7yn8.onrender.com';

const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function runTest() {
    console.log('1. Logging in as Admin...');
    try {
        const adminLogin = await axios.post(`${API_URL}/auth/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const adminToken = adminLogin.data.data.token;
        console.log('   Admin Login Success.');

        // 2. Create Dummy Employee
        const empName = `Test Worker ${Math.floor(Math.random() * 1000)}`;
        const empEmail = `test_${Date.now()}@worker.com`;
        const empPassword = 'Password@123';

        console.log(`2. Creating Dummy Employee: ${empName} (${empEmail})...`);
        const createEmp = await axios.post(`${API_URL}/admin/employees`, {
            full_name: empName,
            email: empEmail,
            password: empPassword,
            department: 'IT',
            hourly_rate: 10
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const employeeId = createEmp.data.data.id; // Adjust based on actual response structure
        console.log(`   Employee Created. ID: ${employeeId}`);

        // 3. Login as Employee to get Token
        console.log('3. Logging in as Employee...');
        const empLogin = await axios.post(`${API_URL}/auth/employee/login`, {
            email: empEmail,
            password: empPassword
        });
        const empToken = empLogin.data.data.token;
        console.log('   Employee Login Success.');

        // 4. Connect to Socket as Employee
        console.log('4. Connecting to Socket as Employee...');
        const socket = io(SOCKET_URL, {
            auth: { token: empToken }
        });

        socket.on('connect', () => {
            console.log(`   ✅ Socket Connected! ID: ${socket.id}`);
            console.log('   Waiting for "start-stream" command...');
            console.log('   --> GO TO YOUR ADMIN DASHBOARD NOW.');
            console.log(`   --> Find employee: "${empName}"`);
            console.log('   --> Click "Watch Live" (Monitor) button.');
        });

        socket.on(`employee:${employeeId}:start-stream`, (data) => {
            console.log('\n\n===================================================');
            console.log('🎉 SUCCESS! RECEIVED START-STREAM SIGNAL FROM SERVER');
            console.log('===================================================');
            console.log('Data received:', data);
            console.log('This proves the Admin -> Server -> Employee path is working.');
            console.log('You can close this script now.');
            process.exit(0);
        });

        socket.on('disconnect', () => {
            console.log('   Socket disconnected.');
        });

    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

runTest();
