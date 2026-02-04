const axios = require('axios');

async function checkAdminTable() {
    // We can't directly query the DB from here, but we can try to use the 'setup-default' endpoint
    // which queries the admin_users table. If the table is missing, this should return a specific error.
    const url = 'https://attendance-backend-7yn8.onrender.com/api/auth/setup-default';
    console.log(`Checking admin table via ${url}...`);

    try {
        const response = await axios.get(url);
        console.log(`Status: ${response.status}`);
        console.log(`Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (e) {
        if (e.response) {
            console.log(`Status: ${e.response.status}`);
            console.log(`Data: ${JSON.stringify(e.response.data, null, 2)}`);
        } else {
            console.log(`Error: ${e.message}`);
        }
    }
}

checkAdminTable();
