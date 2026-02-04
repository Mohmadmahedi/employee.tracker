const axios = require('axios');

async function checkRemote() {
    const baseUrl = 'https://attendance-backend-7yn8.onrender.com';
    const paths = [
        '/',
        '/api',
        '/health',
        '/api/health',
        '/ping',
        '/api/ping'
    ];

    for (const p of paths) {
        try {
            const url = baseUrl + p;
            console.log(`GET ${url}`);
            const res = await axios.get(url, { validateStatus: () => true }); // Accept all status codes
            console.log(`STATUS: ${res.status}`);
            console.log(`TYPE: ${res.headers['content-type']}`);
            if (res.data && typeof res.data === 'object') {
                console.log(`DATA: ${JSON.stringify(res.data)}`);
            } else {
                console.log(`DATA (snippet): ${String(res.data).substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`ERROR: ${e.message}`);
        }
    }
}

checkRemote();
