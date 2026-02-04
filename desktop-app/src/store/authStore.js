import { create } from 'zustand';
import api from '../services/api';
import socketService from '../services/socketService';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isChecking: true, // Start in checking state
  user: null,
  token: null,

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      const { token, refreshToken, admin } = response.data.data;

      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      set({ isAuthenticated: true, user: admin, token, isChecking: false });

      // Connect socket for real-time features
      socketService.connect(token);

      return { success: true };
    } catch (error) {
      // If login explicitly fails, we are done checking
      set({ isChecking: false });
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  },

  employeeLogin: async (email, password, metadata = {}) => {
    try {
      const response = await api.post('/auth/employee/login', {
        email,
        password,
        ...metadata
      });
      const { token, refreshToken, employee } = response.data.data;

      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      set({ isAuthenticated: true, user: employee, token, isChecking: false });

      // Connect socket for WebRTC signaling
      socketService.connect(token);

      return { success: true, token, employee }; // Return details for component
    } catch (error) {
      set({ isChecking: false });
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  },

  logout: () => {
    // 1. Force Stop Tracker (Employee Process)
    if (window.trackerAPI) {
      console.log('[AuthStore] Stopping tracker...');
      try {
        window.trackerAPI.stopTracking();
      } catch (e) { console.error('Error stopping tracker:', e); }
    }

    // 2. Clear Socket
    if (socketService) socketService.disconnect();

    // 3. Clear Storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // Ensure this is cleared if used

    // 4. Reset State
    set({ isAuthenticated: false, user: null, token: null, isChecking: false });

    // 5. Hard Reload to kill any lingering background listeners (CRITICAL for "Ghost" fix)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');

    // If no token exists, we are definitely done checking.
    if (!token) {
      set({ isChecking: false, isAuthenticated: false });
      if (window.trackerAPI) window.trackerAPI.stopTracking();
      return;
    }

    if (token) {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        const response = await Promise.race([
          api.get('/auth/me'),
          timeoutPromise
        ]);
        const user = response.data.data;

        set({ isAuthenticated: true, token, user, isChecking: false }); // Success! Done checking.

        // Connect socket on page refresh/load if auth is valid
        socketService.connect(token);

        // Start tracker ONLY if user is an employee
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || (user.role && user.role.length > 0);

        if (window.trackerAPI) {
          console.log('[AuthStore] Starting tracker (Enabled for ALL roles for testing):', user.id);
          window.trackerAPI.startTracking({ token, employeeId: user.id });
        }
        // if (window.trackerAPI && !isAdmin) {
        //   console.log('[AuthStore] Starting tracker for employee:', user.id);
        //   window.trackerAPI.startTracking({ token, employeeId: user.id });
        // } else if (isAdmin) {
        //   console.log('[AuthStore] User is Admin, skipping tracker start.');
        // }
      } catch (error) {
        console.error('Token validation failed:', error);

        // Timeout Error -> Show login immediately
        if (error.message === 'Connection timeout') {
          console.log('[AuthStore] Connection timeout. Showing login page.');
          set({ isAuthenticated: false, isChecking: false });
          return;
        }

        // Network Error or Server Error (5xx) -> Show login page (don't retry forever)
        if (!error.response || error.response.status >= 500) {
          console.log('[AuthStore] Network/Server error. Showing login page.');
          set({ isAuthenticated: false, isChecking: false });
          return;
        }

        // Rate Limit (429) -> WAIT logic
        if (error.response && error.response.status === 429) {
          console.warn('[AuthStore] 429 Rate Limit. Backing off for 60s...');
          setTimeout(() => {
            const { checkAuth } = get();
            checkAuth();
          }, 60000); // 60s backoff
          return;
        }

        // Only logout if it is explicitly a 401 Unauthorized
        if (error.response && error.response.status === 401) {
          console.warn('[AuthStore] 401 Unauthorized - Invalid Token. Logging out.');
          localStorage.removeItem('token');
          set({ isAuthenticated: false, user: null, token: null, isChecking: false });

          if (window.trackerAPI) {
            window.trackerAPI.stopTracking();
          }
        } else {
          // Other Client Errors (400, 403, 404)
          set({ isAuthenticated: false, isChecking: false });
        }
      }
    }
  }
}));
