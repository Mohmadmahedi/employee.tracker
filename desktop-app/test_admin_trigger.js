const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://attendance-backend-7yn8.onrender.com/api';
const SOCKET_URL = 'https://attendance-backend-7yn8.onrender.com';

const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

// We need the Employee ID from the running "Fake Employee" script.
// Since we can't easily share variables across processes, I'll just check the logs 
// OR simpler: I will just create a NEW Admin connection and try to trigger the specific employee we know exists
// from the previous run output if possible. 
// However, the previous script generated a RANDOM employee. 
// Let's modify this script to FIND the most recently created test employee.

async function runAdminTrigger() {
    console.log('1. Logging in as Admin...');
    try {
        const adminLogin = await axios.post(`${API_URL}/auth/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const adminToken = adminLogin.data.data.token;
        const adminId = adminLogin.data.data.id;
        console.log(`   Admin Login Success. ID: ${adminId}`);

        console.log('2. Connect Admin Socket...');
        const socket = io(SOCKET_URL, {
            auth: { token: adminToken }
        });

        socket.on('connect', async () => {
            console.log('   ✅ Admin Socket Connected!', socket.id);
            socket.emit('admin:join', adminId);

            // 3. Find the Test Employee
            console.log('3. Fetching employees to find the test target...');
            const empRes = await axios.get(`${API_URL}/admin/employees`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            // Find the most recent "Test Worker"
            const employees = empRes.data.data;
            const target = employees
                .filter(e => e.full_name.startsWith('Test Worker'))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (!target) {
                console.error('❌ Could not find the "Test Worker". Make sure the other script ran first.');
                process.exit(1);
            }

            console.log(`   🎯 Found Target: ${target.full_name} (${target.id})`);

            // 4. Trigger the Request
            console.log(`4. Sending "admin:request-live-screen" for ${target.id}...`);
            socket.emit('admin:request-live-screen', {
                employeeId: target.id,
                adminId: adminId
            });
            console.log('   📡 Signal Sent!');

            // Wait a bit to ensure it sends
            setTimeout(() => {
                console.log('   Done. Check the OTHER terminal window for "SUCCESS".');
                process.exit(0);
            }, 5000);
        });

    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

runAdminTrigger();
