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
        const screenshotSettings = settings.data.screenshot || settings.data.filter(s => s.category === 'screenshot');

        // Find screenshot_interval
        const intervalSetting = screenshotSettings.find(s => s.key === 'screenshot_interval');
        console.log(`Current screenshot_interval: ${intervalSetting.value}`);

        // 3. Update Setting
        const newValue = intervalSetting.value === '30' ? '25' : '30';
        console.log(`\n--- 3. Updating screenshot_interval to ${newValue} ---`);

        const updateRes = await fetch(`${API_URL}/settings/global/screenshot_interval`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                setting_key: 'screenshot_interval',
                setting_value: newValue,
                reason: 'Automated verification test'
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
        const newScreenshotSettings = newSettingsFull.data.screenshot || newSettingsFull.data.filter(s => s.category === 'screenshot');
        const newInterval = newScreenshotSettings.find(s => s.key === 'screenshot_interval');

        console.log(`New screenshot_interval: ${newInterval.value}`);

        if (String(newInterval.value) === String(newValue)) {
            console.log('✅ SUCCESS: Setting was updated and persisted.');
        } else {
            console.error(`❌ FAILURE: Expected ${newValue}, got ${newInterval.value}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

verifySettings();
