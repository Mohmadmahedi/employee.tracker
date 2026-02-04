const { io } = require('socket.io-client');

const URL = 'https://attendance-backend-7yn8.onrender.com';
console.log(`Connecting socket to ${URL}...`);

const socket = io(URL, {
    transports: ['websocket', 'polling'], // Try both
    timeout: 10000
});

socket.on('connect', () => {
    console.log(`Socket Connected! ID: ${socket.id}`);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.log(`Connection Error: ${err.message}`);
    // console.log(err);
});

setTimeout(() => {
    console.log('Timeout waiting for connection.');
    process.exit(1);
}, 15000);
