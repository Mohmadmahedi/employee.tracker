import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://screenshare-twth.onrender.com';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Re-register all listeners on reconnect
        this.socket.on('reconnect', () => {
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(cb => this.socket.on(event, cb));
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        const eventListeners = this.listeners.get(event);
        if (eventListeners.has(callback)) {
            console.log(`[SocketService] Listener for ${event} already exists, skipping.`);
            return;
        }

        eventListeners.add(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    joinAdminRoom(adminId) {
        this.emit('admin:join', adminId);
    }

    requestLiveScreen(employeeId, adminId) {
        console.log('[SocketService] 🎥 Requesting live screen:');
        console.log('[SocketService]   Employee ID:', employeeId);
        console.log('[SocketService]   Admin ID:', adminId);
        console.log('[SocketService]   Socket connected:', this.socket?.connected);
        console.log('[SocketService]   My Socket ID:', this.socket?.id);
        this.emit('admin:request-live-screen', { employeeId, adminId });
    }

    getSocketId() {
        return this.socket?.id;
    }
}

const socketService = new SocketService();
export default socketService;
