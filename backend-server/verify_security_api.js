const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function verifySecurity() {
    try {
        // 1. Login to get token
        console.log('--- 1. Logging in ---');
        const loginRes = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.token;

        if (!token) throw new Error('Login failed');
        console.log('Login successful.');

        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Fetch Security Settings
        console.log('\n--- 2. Fetching Security Settings ---');
        const settingsRes = await fetch(`${API_URL}/settings/global`, { headers });
        const settings = await settingsRes.json();
        const securitySettings = settings.data.security || settings.data.filter(s => s.category === 'security');

        console.log('Security Settings:', securitySettings.map(s => `${s.key}: ${s.value}`));

        // 3. Verify Uninstall Password Endpoint (Simulation)
        console.log('\n--- 3. Verifying Admin Password Check (Uninstall Protection) ---');
        const verifyPassRes = await fetch(`${API_URL}/auth/admin/verify-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                password: ADMIN_PASSWORD,
                employee_id: 'test-simulation-id'
            })
        });

        const verifyPassData = await verifyPassRes.json();
        if (verifyPassData.success) {
            console.log('✅ PASS: Admin password correctly verified for protected usage.');
        } else {
            console.error('❌ FAIL: Admin password verification failed.', verifyPassData);
        }

        // 4. Simulate Restricted App Alert Report
        console.log('\n--- 4. Simulating Restricted App Alert ---');
        const alertRes = await fetch(`${API_URL}/alerts/report`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                alert_type: 'RESTRICTED_APP_DETECTED',
                action_attempted: 'Running process: verification_test.exe',
                details: 'Simulated alert from verification script'
            })
        });

        const alertData = await alertRes.json();
        if (alertData.success) {
            console.log('✅ PASS: Alert system accepted security violation report.');
        } else {
            console.error('❌ FAIL: Alert system rejected report.', alertData);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

verifySecurity();
