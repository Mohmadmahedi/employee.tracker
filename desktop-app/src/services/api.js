import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://screenshare-twth.onrender.com/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Check if we already have a refresh promise in progress (to avoid multiple calls)
        // For simplicity in this iteration, we'll just make the call.

        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

        // Update local storage
        localStorage.setItem('token', newToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        // Update default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Update tracker token in background
        if (window.trackerAPI && window.trackerAPI.updateToken) {
          console.log('Updating tracker token in background');
          window.trackerAPI.updateToken(newToken);
        }

        // Retry original request
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Session expired:', refreshError);
        // Logout cleanup
        if (window.trackerAPI) {
          window.trackerAPI.stopTracking();
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
