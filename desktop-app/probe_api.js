const axios = require('axios');

async function checkRemote() {
    const baseUrl = 'https://attendance-backend-7yn8.onrender.com';
    console.log(`Checking API structure...`);

    // We expect 404 for non-existent routes
    // We expect 400/401/405 for existing routes called incorrectly (which proves they exist)

    const routes = [
        '/api/auth/login',
        '/auth/login',
        '/api/employee/login',
        '/employee/login'
    ];

    for (const route of routes) {
        try {
            const url = `${baseUrl}${route}`;
            console.log(`Checking POST ${url}...`);
            await axios.post(url, {});
            console.log(`${route}: 200 OK (Unexpected for empty body)`);
        } catch (e) {
            if (e.response) {
                console.log(`${route}: ${e.response.status} (${e.response.statusText})`);
            } else {
                console.log(`${route}: Error ${e.message}`);
            }
        }
    }
}

checkRemote();
