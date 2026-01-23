import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress } from '@mui/material';
import {
  People,
  PhotoCamera,
  Warning,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import employeeService from '../services/employeeService';
import { toast } from 'react-toastify';

function StatCard({ title, value, icon, color, loading }) {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
        boxShadow: 3
      }}
    >
      <Box>
        <Typography color="text.secondary" variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        {loading ? (
          <CircularProgress size={24} sx={{ mt: 1 }} />
        ) : (
          <Typography variant="h3" fontWeight="bold">{value}</Typography>
        )}
      </Box>
      <Box
        sx={{
          bgcolor: color,
          borderRadius: '16px',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: `0 4px 14px 0 ${color}80`
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await employeeService.getStats();
        setStats(response.data);
      } catch (error) {
        toast.error('Failed to fetch dashboard stats');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time summary of employee activity and system status.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={<People fontSize="large" />}
            color="#1976d2"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Now"
            value={stats?.activeNow || 0}
            icon={<TrendingUp fontSize="large" />}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Working Hours"
            value={`${stats?.workingHoursToday || 0}h`}
            icon={<Schedule fontSize="large" />}
            color="#0288d1"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Security Alerts"
            value={stats?.alertsToday || 0}
            icon={<Warning fontSize="large" />}
            color="#d32f2f"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 4, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          System Quick Guide
        </Typography>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Monitoring Workflow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The desktop application tracks activity every 5 minutes and sends heartbeats to the server.
                Screenshots are captured based on the global or per-employee settings configured in the <strong>Settings</strong> tab.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                Admin Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can fully customize how the application behaves on each computer.
                Changes to intervals, quality, and security protections are applied instantly via WebSockets.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Dashboard;
