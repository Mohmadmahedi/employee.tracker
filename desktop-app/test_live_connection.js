/**
 * Live Screen Connection Debug Script
 * 
 * This script tests the WebSocket connection and WebRTC signaling flow.
 * Run this with: node test_live_connection.js
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Configuration - Update these values
const BACKEND_URL = 'https://screenshare-twth.onrender.com';
const EMPLOYEE_EMAIL = 'test@employee.com'; // Replace with actual employee email
const EMPLOYEE_PASSWORD = 'password123';    // Replace with actual password

async function testLiveConnection() {
    console.log('='.repeat(60));
    console.log('🔍 LIVE SCREEN CONNECTION DEBUGGER');
    console.log('='.repeat(60));
    console.log(`\n📡 Backend URL: ${BACKEND_URL}\n`);

    // Step 1: Test HTTP Connectivity
    console.log('STEP 1: Testing HTTP Connectivity...');
    try {
        const healthCheck = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 10000 });
        console.log('✅ Backend is reachable:', healthCheck.data);
    } catch (e) {
        console.error('❌ Backend HTTP check failed:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.error('   → Server is not running or URL is wrong');
        }
        return;
    }

    // Step 2: Login as Employee
    console.log('\nSTEP 2: Logging in as Employee...');
    let token, employeeId;
    try {
        const loginRes = await axios.post(`${BACKEND_URL}/api/auth/employee/login`, {
            email: EMPLOYEE_EMAIL,
            password: EMPLOYEE_PASSWORD
        });
        token = loginRes.data.data.token;
        employeeId = loginRes.data.data.employee.id;
        console.log('✅ Logged in as Employee ID:', employeeId);
    } catch (e) {
        console.error('❌ Login failed:', e.response?.data?.message || e.message);
        console.error('   → Make sure employee credentials are correct');
        return;
    }

    // Step 3: Connect Socket
    console.log('\nSTEP 3: Connecting WebSocket...');
    const socket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected! Socket ID:', socket.id);
        console.log(`   → Listening for: employee:${employeeId}:start-stream`);

        // Emit live-ready signal
        setTimeout(() => {
            console.log('\n📤 Emitting employee:live-ready signal...');
            socket.emit('employee:live-ready', {});
        }, 1000);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
    });

    // Listen for start-stream event
    socket.on(`employee:${employeeId}:start-stream`, (data) => {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 RECEIVED START-STREAM REQUEST!');
        console.log('='.repeat(60));
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('\n✅ The signaling chain is WORKING!');
        console.log('   → If ScreenBroadcaster is not responding, check:');
        console.log('      1. Is the React component mounted?');
        console.log('      2. Is window.trackerAPI available?');
        console.log('      3. Check browser console for errors');
    });

    // Debug: Listen for ALL socket events
    socket.onAny((eventName, ...args) => {
        console.log(`📥 [Socket Event] ${eventName}`);
    });

    // Keep the script running for 60 seconds
    console.log('\n⏳ Waiting for events... (60 seconds)');
    console.log('💡 Now click "View Live" on the Admin Dashboard');
    console.log('='.repeat(60) + '\n');

    setTimeout(() => {
        console.log('\n⏰ Timeout reached. Disconnecting...');
        socket.disconnect();
        process.exit(0);
    }, 60000);
}

testLiveConnection();
