const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

async function verifySettings() {
    try {
        // 1. Login
        console.log('--- 1. Logging in ---');
        const loginRes = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                type: 'admin'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('Login successful.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get Global Settings
        console.log('\n--- 2. Fetching Global Settings ---');
        const settingsRes = await fetch(`${API_URL}/settings/global`, { headers });
        const settings = await settingsRes.json();

        // Handle response structure
        const monitoringSettings = settings.data.monitoring || settings.data.filter(s => s.category === 'monitoring');

        if (!monitoringSettings) throw new Error('Monitoring settings not found');

        // Find idle_threshold
        const idleSetting = monitoringSettings.find(s => s.key === 'idle_threshold');
        console.log(`Current idle_threshold: ${idleSetting.value}`);

        // 3. Update Setting
        // Toggle between 5 and 10
        const newValue = idleSetting.value === '5' ? '10' : '5';
        console.log(`\n--- 3. Updating idle_threshold to ${newValue} ---`);

        const updateRes = await fetch(`${API_URL}/settings/global/idle_threshold`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                setting_key: 'idle_threshold',
                setting_value: newValue,
                reason: 'Automated verification test - Monitoring'
            })
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
            console.log('Update successful.');
        } else {
            console.error('Update failed:', updateData);
            return;
        }

        // 4. Verify Update
        console.log('\n--- 4. Verifying Update Persistence ---');
        const verifyRes = await fetch(`${API_URL}/settings/global`, { headers });
        const newSettingsFull = await verifyRes.json();
        const newMonitoringSettings = newSettingsFull.data.monitoring || newSettingsFull.data.filter(s => s.category === 'monitoring');
        const newIdle = newMonitoringSettings.find(s => s.key === 'idle_threshold');

        console.log(`New idle_threshold: ${newIdle.value}`);

        if (String(newIdle.value) === String(newValue)) {
            console.log('✅ SUCCESS: Monitoring setting was updated and persisted.');
        } else {
            console.error(`❌ FAILURE: Expected ${newValue}, got ${newIdle.value}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

verifySettings();
