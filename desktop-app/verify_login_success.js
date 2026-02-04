const axios = require('axios');

async function checkLogin() {
    const url = 'https://attendance-backend-7yn8.onrender.com/api/auth/admin/login';
    console.log(`Testing login at ${url}...`);

    try {
        const response = await axios.post(url, {
            email: 'admin@company.com',
            password: 'Admin@123'
        });
        console.log('Login Success!');
        console.log(`Status: ${response.status}`);
        console.log(`Token: ${response.data.data.token ? 'Present' : 'Missing'}`);
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
