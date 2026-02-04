import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Typography, Grid, Box, CircularProgress, Skeleton } from '@mui/material';
import {
  People,
  Warning,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import employeeService from '../services/employeeService';
import { toast } from 'react-toastify';
import AnimatedCard from '../components/AnimatedCard';
import PageTransition from '../components/PageTransition';

// Animated counter component
function AnimatedCounter({ value, duration = 1 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const endValue = parseInt(value) || 0;
    const startTime = performance.now();
    const animDuration = duration * 1000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function StatCard({ title, value, icon, color, loading, index }) {
  const iconVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: index * 0.1 + 0.3
      }
    },
    hover: {
      scale: 1.15,
      rotate: 15,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatedCard
      index={index}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5, 5, 8, 0.8)', // Dark Glass
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.15)', // Gold Border
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: '24px',
        '&:hover': {
          border: '1px solid rgba(255, 215, 0, 0.4)',
          boxShadow: `0 0 30px ${color}40`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)'
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="subtitle1"
          fontWeight="medium"
          sx={{ mb: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}
        >
          {title}
        </Typography>
        {loading ? (
          <Skeleton
            animation="wave"
            variant="text"
            width={80}
            height={50}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
          />
        ) : (
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, #FFF 0%, ${color} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 0 20px ${color}40`
            }}
          >
            <AnimatedCounter value={value} duration={1.5} />
          </Typography>
        )}
      </Box>
      <motion.div
        variants={iconVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
            borderRadius: '16px',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            border: `1px solid ${color}40`,
            boxShadow: `0 0 15px ${color}20`,
            position: 'relative'
          }}
        >
          {icon}
        </Box>
      </motion.div>
    </AnimatedCard>
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
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <PageTransition>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #FFF 0%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                }}
              >
                Dashboard Overview
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Real-time summary of employee activity and system status.
              </Typography>
            </Box>
          </motion.div>

          {/* Stats Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Employees"
                value={stats?.totalEmployees || 0}
                icon={<People fontSize="large" />}
                color="#FFD700" // Gold
                loading={loading}
                index={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Now"
                value={stats?.activeNow || 0}
                icon={<TrendingUp fontSize="large" />}
                color="#00E5FF" // Cyan Neon
                loading={loading}
                index={1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Working Hours"
                value={`${stats?.workingHoursToday || 0}`}
                icon={<Schedule fontSize="large" />}
                color="#00FF00" // Green Neon
                loading={loading}
                index={2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Security Alerts"
                value={stats?.alertsToday || 0}
                icon={<Warning fontSize="large" />}
                color="#FF4500" // Plasma Orange
                loading={loading}
                index={3}
              />
            </Grid>
          </Grid>

          {/* Quick Guide Section */}
          <motion.div variants={itemVariants}>
            <AnimatedCard
              index={4}
              sx={{
                mt: 4,
                p: 4,
                borderRadius: '24px',
                background: 'rgba(5, 5, 8, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#FFF'
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  📚
                </motion.span>
                System Quick Guide
              </Typography>

              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        mb: 2,
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: 'rgba(255, 215, 0, 0.05)',
                        borderLeft: '4px solid #FFD700',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 215, 0, 0.1)',
                          boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
                        }
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#FFD700' }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          📊
                        </motion.span>
                        Monitoring Workflow
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        The desktop application tracks activity every 5 minutes and sends heartbeats to the server.
                        Screenshots are captured based on the global or per-employee settings configured in the <strong style={{ color: '#FFF' }}>Settings</strong> tab.
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        mb: 2,
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: 'rgba(255, 69, 0, 0.05)',
                        borderLeft: '4px solid #FF4500',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 69, 0, 0.1)',
                          boxShadow: '0 4px 20px rgba(255, 69, 0, 0.1)'
                        }
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#FF4500' }}
                      >
                        <motion.span
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        >
                          ⚙️
                        </motion.span>
                        Admin Control
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        You can fully customize how the application behaves on each computer.
                        Changes to intervals, quality, and security protections are applied instantly via WebSockets.
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </AnimatedCard>
          </motion.div>
        </motion.div>
      </Container>
    </PageTransition>
  );
}

export default Dashboard;
