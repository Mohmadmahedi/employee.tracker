import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  ShieldAlert,
  Lock,
  Mail,
  ShieldCheck,
  Info,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Identity verification failed. Access denied.');
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0b10',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Cyber-background decoration */}
      <Box sx={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(103, 58, 183, 0.1) 0%, transparent 70%)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-5%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(63, 81, 181, 0.08) 0%, transparent 70%)',
        zIndex: 0
      }} />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: 4,
            bgcolor: '#161822',
            color: '#fff',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(103, 58, 183, 0.1)',
              mb: 2,
              border: '1px solid rgba(103, 58, 183, 0.3)'
            }}>
              <ShieldAlert size={48} color="#9575cd" />
            </Box>
            <Typography variant="h5" fontWeight="800" letterSpacing={1}>
              SYSTEM ANTI-VIRUS
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
              Administrative Center Login
            </Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: '#311b92', '& .MuiLinearProgress-bar': { bgcolor: '#9575cd' } }} />}

          {error && (
            <Alert
              severity="error"
              variant="filled"
              sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.2)', border: '1px solid #f44336' }}
              icon={<ShieldAlert size={20} />}
            >
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              placeholder="Administrator Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="filled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="#666" />
                  </InputAdornment>
                ),
                disableUnderline: true,
                sx: {
                  bgcolor: '#0f111a',
                  borderRadius: 2,
                  color: '#fff',
                  '&:hover': { bgcolor: '#1a1d29' }
                }
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              placeholder="Management Access Key"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="filled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} color="#666" />
                  </InputAdornment>
                ),
                disableUnderline: true,
                sx: {
                  bgcolor: '#0f111a',
                  borderRadius: 2,
                  color: '#fff',
                  '&:hover': { bgcolor: '#1a1d29' }
                }
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                bgcolor: '#673ab7',
                '&:hover': { bgcolor: '#5e35b1' },
                boxShadow: '0 4px 14px 0 rgba(103, 58, 183, 0.39)'
              }}
            >
              {loading ? 'Verifying Identity...' : 'Enter Admin Center'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                fullWidth
                onClick={() => navigate('/employee-login')}
                sx={{
                  textTransform: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }
                }}
                startIcon={<Info size={14} />}
              >
                Switch to Workstation Activation
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
              <ShieldCheck size={12} /> Management Protocol Active
            </Typography>
          </Box>
        </Paper>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255, 255, 255, 0.1)' }}>
          Admin Console Security v1.0.4 • Management Module
        </Typography>
      </Container>
    </Box>
  );
}

export default Login;
