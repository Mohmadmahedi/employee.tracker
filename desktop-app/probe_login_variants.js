const axios = require('axios');

async function checkLogin() {
    const baseUrl = 'https://attendance-backend-7yn8.onrender.com';
    const routes = [
        '/login',
        '/api/login',
        '/user/login',
        '/api/user/login',
        '/users/login',
        '/api/users/login',
        '/employee/login',
        '/api/employee/login',
        '/auth/login',
        '/api/auth/login'
    ];

    console.log('Probing login routes...');

    for (const r of routes) {
        try {
            await axios.post(baseUrl + r, {});
            console.log(`${r}: 200 OK`);
        } catch (e) {
            if (e.response) {
                if (e.response.status !== 404) {
                    console.log(`FOUND! ${r}: ${e.response.status} ${e.response.statusText}`);
                } else {
                    // console.log(`${r}: 404`);
                }
            }
        }
    }
    console.log('Probe complete.');
}

checkLogin();
