const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");

contextBridge.exposeInMainWorld("trackerAPI", {
    startTracking: (auth) => ipcRenderer.send("START_TRACKING", auth),
    stopTracking: () => ipcRenderer.send("STOP_TRACKING"),
    requestStatus: () => ipcRenderer.send("REQUEST_STATUS"),
    onStatusUpdate: (cb) => {
        ipcRenderer.removeAllListeners("STATUS_UPDATE");
        ipcRenderer.on("STATUS_UPDATE", (event, status) => cb(status));
    },
    onTrackingStarted: (cb) => {
        ipcRenderer.removeAllListeners("TRACKING_STARTED");
        ipcRenderer.on("TRACKING_STARTED", (event, result) => cb(result));
    },

    // Recording features
    onStartRecording: (cb) => {
        ipcRenderer.removeAllListeners("START_RECORDING");
        ipcRenderer.on("START_RECORDING", (event, args) => cb(args));
    },
    onStopRecording: (cb) => {
        ipcRenderer.removeAllListeners("STOP_RECORDING");
        ipcRenderer.on("STOP_RECORDING", () => cb());
    },

    // WebRTC Streaming
    onStartWebRTCStream: (cb) => {
        ipcRenderer.removeAllListeners("START_WEBRTC_STREAM");
        ipcRenderer.on("START_WEBRTC_STREAM", (event, args) => cb(args));
    },
    onStopWebRTCStream: (cb) => {
        ipcRenderer.removeAllListeners("STOP_WEBRTC_STREAM");
        ipcRenderer.on("STOP_WEBRTC_STREAM", (event, args) => cb(args));
    },

    // Token management
    updateToken: (token) => ipcRenderer.send("TOKEN_UPDATED", token),

    getDesktopSourceId: async () => {
        // Use IPC to get desktop sources from main process (required in newer Electron)
        return await ipcRenderer.invoke('GET_DESKTOP_SOURCE_ID');
    },

    // Security & Admin
    forceQuitApp: () => ipcRenderer.send("FORCE_QUIT_APP"),
    verifyAdminPassword: (password) => ipcRenderer.invoke("VERIFY_ADMIN_PASSWORD", password),

    // Visibility
    showLogin: () => ipcRenderer.send("SHOW_LOGIN"),
    hideApp: () => ipcRenderer.send("HIDE_APP"),
    onForceLogout: (cb) => ipcRenderer.on("FORCE_LOGOUT", () => cb())
});
