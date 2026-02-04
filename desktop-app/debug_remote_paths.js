const axios = require('axios');

async function checkRemote() {
    const baseUrl = 'https://attendance-backend-7yn8.onrender.com';
    console.log(`Checking remote server roots...`);

    const paths = ['', '/api', '/api/health', '/health'];

    for (const path of paths) {
        try {
            const url = `${baseUrl}${path}`;
            console.log(`Checking ${url}...`);
            const response = await axios.get(url);
            console.log(`Status: ${response.status}`);
            console.log(`Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (e) {
            console.log(`Error for ${path}: ${e.message}`);
            if (e.response) console.log(`Status: ${e.response.status}`);
        }
    }
}

checkRemote();
