const axios = require('axios');

async function checkRemote() {
    const url = 'https://attendance-backend-7yn8.onrender.com/health';
    console.log(`Checking remote server at ${url}...`);

    for (let i = 0; i < 5; i++) {
        try {
            console.log(`Attempt ${i + 1}...`);
            const response = await axios.get(url);
            console.log(`Response Status: ${response.status}`);
            console.log(`Response Data: ${JSON.stringify(response.data)}`);
            if (response.status === 200) {
                console.log('SUCCESS: Remote server is reachable and healthy.');
                return;
            }
        } catch (e) {
            console.log(`Error on attempt ${i + 1}: ${e.message}`);
            if (e.response) {
                console.log(`Status: ${e.response.status}`);
            }
        }
        // Wait 5 seconds before retry
        console.log('Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log('FAILURE: Could not connect to remote server after multiple attempts.');
}

checkRemote();
