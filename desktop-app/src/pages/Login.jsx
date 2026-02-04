import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  ShieldAlert,
  Lock,
  Fingerprint,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import '../futuristic_theme.css';

const MotionTextField = motion.create(TextField);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500)); // Dramatic layout delay

    // Default credentials for demo if empty
    const tryEmail = email || 'admin@company.com';
    const tryPass = password || 'admin123';

    const result = await login(tryEmail, tryPass);
    if (result.success) {
      navigate('/');
    } else {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Backgrounds */}
      <div className="futuristic-bg" />
      <div className="grid-overlay" />

      {/* Floating Particles - Left */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)', // Gold
          filter: 'blur(40px)',
          zIndex: 0
        }}
      />

      {/* Floating Particles - Right */}
      <motion.div
        animate={{
          y: [20, -20, 20],
          rotate: [360, 0],
          scale: [1.2, 1, 1.2]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 69, 0, 0.08) 0%, transparent 70%)', // Orange/Red
          filter: 'blur(50px)',
          zIndex: 0
        }}
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <Tilt
          tiltMaxAngleX={5}
          tiltMaxAngleY={5}
          perspective={1000}
          scale={1.02}
          glareEnable={true}
          glareMaxOpacity={0.45}
          glareColor="#FFD700" // Gold Glare
          glarePosition="all"
          glareBorderRadius="24px"
        >
          <div className="holo-card">
            <div className="glow-border" />

            <Box component="form" onSubmit={handleLogin} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ position: 'relative', marginBottom: '24px' }}
              >
                <div style={{
                  position: 'absolute',
                  inset: '-10px',
                  background: 'linear-gradient(45deg, #FFD700, #FF4500)', // Gold to Orange
                  borderRadius: '50%',
                  filter: 'blur(15px)',
                  opacity: 0.6
                }} />
                <Box sx={{
                  position: 'relative',
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.8)',
                  border: '2px solid rgba(255, 215, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
                }}>
                  <ShieldAlert size={36} color="#FFD700" />
                </Box>
              </motion.div>

              {/* Title */}
              <Typography variant="h4" className="neon-text glitch-hover" sx={{ fontWeight: 800, mb: 1, letterSpacing: '1px', textAlign: 'center' }}>
                ACCESS PORTAL
              </Typography>
              <Typography className="neon-subtext" sx={{ mb: 4, textAlign: 'center' }}>
                Restricted Area • Admin Only
              </Typography>

              {/* Inputs */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <MotionTextField
                  fullWidth
                  placeholder="ID / Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Fingerprint color="rgba(255, 215, 0, 0.7)" />
                      </InputAdornment>
                    ),
                    className: 'cyber-input',
                    sx: { height: '55px', borderRadius: '12px', color: '#FFD700' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                  }}
                />

                <MotionTextField
                  fullWidth
                  placeholder="Passcode"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="rgba(255, 215, 0, 0.7)" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOff color="rgba(255, 215, 0, 0.5)" size={20} /> : <Eye color="rgba(255, 215, 0, 0.5)" size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    className: 'cyber-input',
                    sx: { height: '55px', borderRadius: '12px', color: '#FFD700' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                  }}
                />
              </Box>

              {/* Login Button */}
              <Button
                fullWidth
                type="submit"
                disabled={isLoading}
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                sx={{
                  mt: 4,
                  py: 1.8,
                  background: 'linear-gradient(90deg, #B8860B 0%, #FF8C00 100%)', // Gold to Dark Orange
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#000', // Black text on gold is very premium
                  boxShadow: '0 0 20px rgba(255, 140, 0, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(transparent, rgba(255,255,255,0.4), transparent)',
                    transform: 'rotate(45deg)',
                    animation: isLoading ? 'shimmer 1s infinite' : 'none'
                  },
                  '&:hover': {
                    boxShadow: '0 0 30px rgba(255, 140, 0, 0.6)'
                  }
                }}
              >
                {isLoading ? 'AUTHENTICATING...' : 'INITIATE SESSION'}
              </Button>

              {isLoading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress sx={{ bgcolor: 'rgba(255, 215, 0, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#FFD700' } }} />
                  <Typography variant="caption" className="neon-text" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                    Establishing Secure Handshake...
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Cpu size={16} color="rgba(255, 215, 0, 0.3)" />
                <Typography variant="caption" sx={{ color: 'rgba(255, 215, 0, 0.3)', letterSpacing: '2px' }}>
                  SYSTEM V.4.20.7
                </Typography>
              </Box>

              <Button
                onClick={() => navigate('/employee-login')}
                sx={{
                  mt: 3,
                  color: 'rgba(255, 215, 0, 0.5)',
                  fontSize: '0.75rem',
                  '&:hover': { color: '#FFD700', bgcolor: 'transparent' }
                }}
              >
                SWITCH TO TERMINAL MODE
              </Button>

            </Box>
          </div>
        </Tilt>
      </Container>
    </Box>
  );
}

export default Login;
