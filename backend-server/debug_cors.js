const axios = require('axios');

async function testCors() {
    const url = 'https://my-attendance-api-v2.onrender.com/api/health';
    const origin = 'http://localhost:5173';

    console.log(`Testing CORS for ${url}`);
    console.log(`Simulating Origin: ${origin}`);

    try {
        const response = await axios.options(url, {
            headers: {
                'Origin': origin,
                'Access-Control-Request-Method': 'GET'
            }
        });

        console.log('\n✅ Response Status:', response.status);
        console.log('✅ CORS Headers:', {
            'access-control-allow-origin': response.headers['access-control-allow-origin'],
            'access-control-allow-methods': response.headers['access-control-allow-methods']
        });

    } catch (error) {
        console.log('\n❌ Request Failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testCors();
