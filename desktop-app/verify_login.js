const axios = require('axios');

async function checkLogin() {
    const baseUrl = 'https://attendance-backend-7yn8.onrender.com';
    const routes = ['/auth/login', '/api/auth/login'];

    for (const r of routes) {
        try {
            console.log(`POST ${baseUrl}${r}...`);
            await axios.post(baseUrl + r, {});
            console.log(`${r}: 200 OK (Unexpected)`);
        } catch (e) {
            if (e.response) {
                console.log(`${r}: ${e.response.status} ${e.response.statusText}`);
                if (e.response.status !== 404) {
                    console.log(`FOUND! The correct route is likely ${r}`);
                }
            } else {
                console.log(`${r}: Error ${e.message}`);
            }
        }
    }
}

checkLogin();
