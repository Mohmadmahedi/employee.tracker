import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import LiveMonitoring from './pages/LiveMonitoring';
import Screenshots from './pages/Screenshots';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Activity from './pages/Activity';
import ScreenRecordings from './pages/ScreenRecordings';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

function App() {
  const { isAuthenticated, user, checkAuth, isChecking } = useAuthStore();

  useEffect(() => {
    console.log('[System] Connectivity Diagnostics:');
    console.log('[System]   API Endpoint:', import.meta.env.VITE_API_URL || 'https://screenshare-twth.onrender.com/api (Default)');
    console.log('[System]   Socket Endpoint:', import.meta.env.VITE_SOCKET_URL || 'https://screenshare-twth.onrender.com (Default)');

    checkAuth();

    // Listen for force logout from main process (e.g. invalid token)
    if (window.trackerAPI && window.trackerAPI.onForceLogout) {
      window.trackerAPI.onForceLogout(() => {
        console.log('Force logout received');
        useAuthStore.getState().logout();
      });
    }
  }, []);

  // Effect to handle window visibility based on auth state
  useEffect(() => {
    // Only manage window visibility if we are NOT checking anymore
    if (!isChecking) {
      if (isAuthenticated && user) {
        // STEALTH: Only hide the window if the user is an Employee
        // Admins need to see the dashboard to manage the system
        if (window.trackerAPI && !user.role) {
          console.log('[System] Employee detected, entering stealth mode');
          // window.trackerAPI.hideApp(); // DISABLED FOR DEBUGGING
        } else if (window.trackerAPI && user.role) {
          console.log('[System] Admin detected, showing dashboard');
          window.trackerAPI.showLogin(); // showLogin actually just shows the window
        }
      } else {
        // Not authenticated -> Show Login
        if (window.trackerAPI) {
          window.trackerAPI.showLogin();
        }
      }
    } else {
      // While checking, show window so user sees "Connecting"
      if (window.trackerAPI) {
        window.trackerAPI.showLogin();
      }
    }
  }, [isAuthenticated, isChecking, user]);

  if (isChecking) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white'
      }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Connecting to Server...</Typography>
        <Typography variant="caption" sx={{ mt: 1, color: 'gray' }}>Please wait while we establish connection.</Typography>
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />

      {/* Protected Routes */}
      <Route path="/*" element={
        isAuthenticated ? (
          user?.role ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/live-monitoring" element={<LiveMonitoring />} />
                <Route path="/screenshots" element={<Screenshots />} />
                <Route path="/screen-recordings" element={<ScreenRecordings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Routes>
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="*" element={<Navigate to="/employee-dashboard" />} />
            </Routes>
          )
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
}

export default App;
