const axios = require('axios');

async function checkLogin() {
    const url = 'https://attendance-backend-7yn8.onrender.com/api/auth/admin/login';
    console.log(`Testing login at ${url}...`);

    try {
        await axios.post(url, {
            email: 'admin@company.com',
            password: 'admin'
        });
        console.log('Login Success (Unexpected)');
    } catch (e) {
        if (e.response) {
            console.log(`Status: ${e.response.status}`);
            console.log(`Data: ${JSON.stringify(e.response.data, null, 2)}`);
        } else {
            console.log(`Error: ${e.message}`);
        }
    }
}

checkLogin();
