const axios = require('axios');
const screenshot = require('screenshot-desktop');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { uIOhook } = require('uiohook-napi');

class TrackerService {
    constructor(apiUrl, socketUrl) {
        this.apiUrl = apiUrl;
        this.socketUrl = socketUrl;
        this.token = null;
        this.employeeId = null;
        this.socket = null;
        this.status = 'OFF';
        this.heartbeatInterval = null;
        this.screenshotInterval = null;
        this.recordingInterval = null;
        this.onRecordingStart = null; // Callback to trigger recording in renderer
        this.settings = {
            screenshot_interval_minutes: 5,
            recording_interval_minutes: 30,
            recording_duration_sec: 15, // 15 seconds
            idle_timeout_minutes: 5, // Default 5 mins for inactivity alert
            low_speed_threshold_kpm: 20, // Default 20 keys per minute
            restricted_apps: ['regedit.exe', 'powershell.exe', 'cmd.exe', 'notepad.exe'] // Security risks + Test
        };
        this.appCheckInterval = null;

        // Activity Tracking
        this.keyCount = 0;
        this.lastKeyboardTime = Date.now();
        this.lastMouseTime = Date.now();
        this.activityCheckInterval = null;
        this.onAlert = null; // Callback for local desktop alerts

        // WebRTC Stream handlers
        this.onStartStream = null;
        this.onStopStream = null;
        this.onLogout = null;
    }

    setStartStreamHandler(handler) {
        this.onStartStream = handler;
    }

    setStopStreamHandler(handler) {
        this.onStopStream = handler;
    }

    setLogoutHandler(handler) {
        this.onLogout = handler;
    }

    setAuth(token, employeeId) {
        this.token = token;
        this.employeeId = employeeId;
    }

    async start() {
        // Ensure clean state before starting
        await this.stop();

        this.status = 'WORKING';
        this.connectSocket();
        this.startHeartbeat();
        this.startScreenshotTimer();
        this.startRecordingTimer();
        this.startAppCheckTimer();
        this.startActivityTracking();
        console.log('Tracker started');
    }

    async stop() {
        console.log('Stopping tracker...');
        this.status = 'OFF';

        // Send one final heartbeat to notify server and admin we are stopping
        try {
            await this.sendHeartbeat();
        } catch (e) {
            console.error('Final heartbeat failed:', e.message);
        }

        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.screenshotInterval) clearInterval(this.screenshotInterval);
        if (this.recordingInterval) clearInterval(this.recordingInterval);
        if (this.appCheckInterval) clearInterval(this.appCheckInterval);
        if (this.activityCheckInterval) clearInterval(this.activityCheckInterval);

        this.stopActivityTracking();

        if (this.socket) {
            console.log('Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
        }
        console.log('Tracker stopped');
    }

    startActivityTracking() {
        // Initialize uIOhook
        uIOhook.on('keydown', () => {
            this.keyCount++;
            this.lastKeyboardTime = Date.now();
        });

        uIOhook.on('mousemove', () => {
            this.lastMouseTime = Date.now();
        });

        uIOhook.on('mousedown', () => {
            this.lastMouseTime = Date.now();
        });

        uIOhook.start();

        // Check activity every 1 minute
        this.activityCheckInterval = setInterval(() => {
            this.checkActivity();
        }, 60 * 1000);
    }

    stopActivityTracking() {
        try {
            uIOhook.stop();
            uIOhook.removeAllListeners('keydown');
            uIOhook.removeAllListeners('mousemove');
            uIOhook.removeAllListeners('mousedown');
        } catch (e) {
            console.error('Error stopping uIOhook:', e);
        }
    }

    checkActivity() {
        const now = Date.now();
        const lastActivityTime = Math.max(this.lastKeyboardTime, this.lastMouseTime);
        const idleThresholdMs = this.settings.idle_timeout_minutes * 60 * 1000;

        const timeSinceLastActivity = now - lastActivityTime;
        // 1. Check General Inactivity (Both Mouse and Keyboard idle)
        if (timeSinceLastActivity > idleThresholdMs) {
            console.log('User is idle');
            this.sendAlert('USER_IDLE', `Inactive for ${Math.round(timeSinceLastActivity / 60000)} minutes`);
            return; // If completely idle, don't check specific mouse/keyboard inactivity
        }

        // 2. Check Specific Mouse Inactivity (e.g., typing but not using mouse)
        const timeSinceMouse = now - this.lastMouseTime;
        if (timeSinceMouse > idleThresholdMs) {
            console.log('Mouse is inactive');
            this.sendAlert('MOUSE_INACTIVE', `No mouse movement for ${Math.round(timeSinceMouse / 60000)} minutes`);
        }

        // 3. Check Typing Speed (if not completely idle)
        const kpm = this.keyCount;
        this.keyCount = 0; // Reset for next minute

        if (kpm > 0 && kpm < this.settings.low_speed_threshold_kpm) {
            console.log(`Low typing speed detected: ${kpm} KPM`);
            this.sendAlert('LOW_TYPING_SPEED', `Speed: ${kpm} KPM (Threshold: ${this.settings.low_speed_threshold_kpm})`);
        }
    }

    async startHeartbeat() {
        // Send immediate heartbeat
        await this.sendHeartbeat();

        // Set interval (default 5 mins)
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 5 * 60 * 1000);
    }

    async sendHeartbeat() {
        if (!this.token) return;

        try {
            const timestamp = new Date().toISOString();
            const cleanToken = (this.token || '').trim();
            // console.log(`Sending heartbeat to ${this.apiUrl}/attendance/heartbeat...`); // Reduced noise

            const response = await axios.post(`${this.apiUrl}/attendance/heartbeat`, {
                status: this.status,
                timestamp,
                pc_name: process.env.COMPUTERNAME || 'Unknown PC'
            }, {
                headers: { Authorization: `Bearer ${cleanToken}` }
            });

            // Emit socket heartbeat for real-time admin monitoring
            if (this.socket && this.socket.connected) {
                console.log(`[TrackerService] Emitting socket heartbeat: status=${this.status}`);
                this.socket.emit('employee:heartbeat', {
                    employeeId: this.employeeId,
                    status: this.status,
                    timestamp
                });

                // If stopping, allow event to propagate before potential disconnect
                if (this.status === 'OFF') {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (response.data.success) {
                // console.log('Heartbeat sent successfully');
                // Update local settings if backend sends them
                if (response.data.settings) {
                    this.updateSettings(response.data.settings);
                }
            }
        } catch (error) {
            console.error('Heartbeat failed:', error.message);

            // Check for 401 Unauthorized or explicit logout signal
            if (error.response) {
                if (error.response.status === 401) {
                    console.log('Authentication failed, stopping tracker...');
                    this.stop();
                    if (this.onLogout) this.onLogout();
                } else if (error.response.status === 429) {
                    console.warn('[TrackerService] ⚠️ Rate limit exceeded. Backing off...');
                } else if (error.response.status === 503) {
                    console.warn('[TrackerService] ⚠️ Server temporarily unavailable (503). Retrying later...');
                }
            }
        }
    }

    logToFile(message) {
        const logPath = path.join(process.cwd(), 'tracker_debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    }

    async captureAndUploadScreenshot() {
        if (!this.token) {
            this.logToFile('Skipping screenshot: No token');
            return;
        }

        try {
            this.logToFile('Starting screenshot capture...');
            const imgBuffer = await screenshot({ format: 'jpg' });
            this.logToFile(`Screenshot captured. Buffer size: ${imgBuffer.length}`);

            const filename = `temp_screenshot_${Date.now()}.jpg`;
            const filePath = path.join(process.cwd(), filename);

            fs.writeFileSync(filePath, imgBuffer);

            const formData = new (require('form-data'))();
            formData.append('screenshot', fs.createReadStream(filePath));
            formData.append('timestamp', new Date().toISOString());

            this.logToFile(`Uploading screenshot to ${this.apiUrl}/screenshots/upload`);
            await axios.post(`${this.apiUrl}/screenshots/upload`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${this.token}`
                }
            });

            this.logToFile('Screenshot uploaded successfully');
            console.log('Screenshot uploaded');
            fs.unlinkSync(filePath);
        } catch (error) {
            this.logToFile(`Screenshot capture/upload failed: ${error.message}`);
            console.error('Screenshot capture/upload failed:', error.message);
        }
    }

    startScreenshotTimer() {
        if (this.screenshotInterval) clearInterval(this.screenshotInterval);

        const ms = this.settings.screenshot_interval_minutes * 60 * 1000;
        this.screenshotInterval = setInterval(() => {
            this.captureAndUploadScreenshot();
        }, ms);
    }

    startRecordingTimer() {
        if (this.recordingInterval) clearInterval(this.recordingInterval);

        const ms = this.settings.recording_interval_minutes * 60 * 1000;
        this.recordingInterval = setInterval(() => {
            this.triggerRecording();
        }, ms);
    }

    startAppCheckTimer() {
        if (this.appCheckInterval) clearInterval(this.appCheckInterval);

        // Check every 1 minute
        this.appCheckInterval = setInterval(() => {
            this.checkRestrictedApps();
        }, 60 * 1000);
    }

    async checkRestrictedApps() {
        if (!this.token) return;

        exec('tasklist', (err, stdout, stderr) => {
            if (err) {
                console.error('Failed to run tasklist:', err);
                return;
            }

            const processes = stdout.toLowerCase();

            for (const app of this.settings.restricted_apps) {
                if (processes.includes(app.toLowerCase())) {
                    console.log(`Restricted app detected: ${app}`);
                    this.sendAlert('RESTRICTED_APP_DETECTED', `Running process: ${app}`);
                }
            }
        });
    }

    async sendAlert(type, action) {
        if (!this.token) return;

        // Debounce reports to avoid flooding
        // For USER_IDLE, we want one alert every X mins, not every minute with different duration text
        let key = `${type}-${action}`;
        if (type === 'USER_IDLE' || type === 'MOUSE_INACTIVE') {
            key = type; // Ignore the "Inactive for X mins" part for distinct key
        }

        const now = Date.now();

        // Different debounce for different types
        let debounceTime = 5 * 60 * 1000; // Default 5 mins
        if (type === 'RESTRICTED_APP_DETECTED') {
            debounceTime = 10 * 1000; // Only 10 seconds for restricted apps (Critical)
        }

        if (this.lastAlertTime && this.lastAlertTime[key] && (now - this.lastAlertTime[key] < debounceTime)) {
            return; // Skip if reported recently
        }

        if (!this.lastAlertTime) this.lastAlertTime = {};
        this.lastAlertTime[key] = now;

        try {
            await axios.post(`${this.apiUrl}/alerts/report`, {
                alert_type: type,
                action_attempted: action, // Reusing this field for details like "20 KPM" or "10 mins"
                details: `Detected on ${process.env.COMPUTERNAME || 'PC'}`
            }, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            console.log('Alert sent:', type);
            this.logToFile(`Alert sent: ${type} - ${action}`);
        } catch (error) {
            console.error('Failed to send alert:', error.message);
        }

        // Trigger local desktop alert if handler is registered
        if (this.onAlert) {
            this.onAlert(type, action);
        }
    }

    triggerRecording() {
        if (!this.token || !this.onRecordingStart) return;

        console.log('Triggering screen recording...');
        this.onRecordingStart({
            duration: this.settings.recording_duration_sec * 1000,
            employeeId: this.employeeId
        });
    }

    connectSocket() {
        if (this.socket) {
            console.log('[TrackerService] Disconnecting existing socket before new connection...');
            this.socket.disconnect();
            this.socket.removeAllListeners(); // Clean slate
        }

        console.log(`[TrackerService] Connecting socket with employeeId: ${this.employeeId}`);
        this.logToFile(`Connecting socket with employeeId: ${this.employeeId}`);

        this.socket = io(this.socketUrl, {
            auth: { token: this.token },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        this.socket.on('connect', () => {
            console.log(`[TrackerService] Connected to WebSocket. Socket ID: ${this.socket.id}`);
            console.log(`[TrackerService] Listening for: employee:${this.employeeId}:start-stream`);
            this.logToFile(`Socket connected. Listening for employee:${this.employeeId}:start-stream`);
            this.sendHeartbeat(); // Immediate sync on connect
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[TrackerService] Socket disconnected: ${reason}`);
            this.logToFile(`Socket disconnected: ${reason}`);
        });

        this.socket.on('connect_error', (error) => {
            console.log(`[TrackerService] Socket connect error: ${error.message}`);
        });

        // Handle live screen request from admin -> Delegate to Renderer (WebRTC)
        this.socket.on(`employee:${this.employeeId}:start-stream`, async (data) => {
            console.log('[TrackerService] ✅ Live screen request received (WebRTC)', data);
            this.logToFile('WebRTC stream request received');
            if (this.onStartStream) {
                this.onStartStream(data);
            } else {
                console.error('[TrackerService] ❌ onStartStream handler not set!');
            }
        });

        // Handle stop stream request -> Delegate to Renderer
        this.socket.on(`employee:${this.employeeId}:stop-stream`, async (data) => {
            console.log('[TrackerService] Stop screen request received');
            if (this.onStopStream) {
                this.onStopStream(data);
            }
        });

        // Handle immediate screenshot request
        this.socket.on(`employee:${this.employeeId}:capture-screenshot`, async (data) => {
            console.log('[TrackerService] Immediate screenshot request received');
            this.logToFile('Immediate screenshot request received from socket');
            await this.captureAndUploadScreenshot();
        });

        // Handle global config update
        this.socket.on('employee:config-update', (settings) => {
            console.log('[TrackerService] Global config update received');
            this.logToFile('Global config update received via socket');
            this.updateSettings(settings);
        });

        // Handle employee-specific config update
        this.socket.on(`employee:${this.employeeId}:config-update`, (settings) => {
            console.log('[TrackerService] Employee config update received');
            this.logToFile('Employee specific config update received');
            this.updateSettings(settings);
        });

        // Debug: Listen for ALL events to see what's coming through
        this.socket.onAny((eventName, ...args) => {
            console.log(`[TrackerService] 📥 Socket Event: ${eventName}`, args);
        });
    }

    // ... (updateSettings remains same)

    async startLiveStreaming(adminId) {
        // Deprecated in favor of WebRTC in renderer
        console.log('Main process startLiveStreaming called - delegating to renderer via socket event');
    }

    setStatus(newStatus) {
        if (this.status !== 'OFF') {
            this.status = newStatus;
            this.sendHeartbeat(); // Immediate sync
        }
    }

    setEventHandler(handler) {
        this.onRecordingStart = handler;
    }

    setLogoutHandler(handler) {
        this.onLogout = handler;
    }

    setAlertHandler(handler) {
        this.onAlert = handler;
    }

    updateToken(newToken) {
        this.token = newToken;
        console.log('TrackerService: Token updated successfully');
        this.logToFile('Token updated via IPC');

        // Reconnect socket with new token
        if (this.socket) {
            this.socket.auth.token = newToken;
            if (this.socket.connected) {
                this.socket.disconnect().connect();
            } else {
                this.connectSocket();
            }
        }
    }
}

module.exports = TrackerService;
