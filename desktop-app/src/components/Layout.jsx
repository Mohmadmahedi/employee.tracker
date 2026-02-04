import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  VisibilityOutlined,
  PhotoCamera,
  Assessment,
  NotificationsActive,
  Logout,
  VideoCameraBack,
  PendingActions
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ScreenRecorder from './ScreenRecorder';
import ScreenBroadcaster from './ScreenBroadcaster';
import '../futuristic_theme.css'; // Cosmic Gold Theme

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { text: 'Live Monitoring', icon: <VisibilityOutlined />, path: '/live-monitoring' },
  { text: 'Screenshots', icon: <PhotoCamera />, path: '/screenshots' },
  { text: 'Screen Recording', icon: <VideoCameraBack />, path: '/screen-recordings' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Activity', icon: <PendingActions />, path: '/activity' },
  { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function AnimatedMenuItem({ item, isSelected, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          selected={isSelected}
          onClick={onClick}
          // We let CSS handle the hover/selected states for performance and cleaner code
          // in .holo-sidebar .Mui-selected
          sx={{
            mx: 1.5,
            borderRadius: 3,
            '& .MuiListItemIcon-root': {
              color: isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
            },
            '& .MuiListItemText-primary': {
              color: isSelected ? '#FFF' : 'rgba(255, 255, 255, 0.6)',
              fontWeight: isSelected ? 'bold' : 'normal',
              letterSpacing: '0.5px'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {/* Animated Icon Rotation on Select */}
            <motion.div
              animate={{ rotate: isSelected ? 360 : 0, scale: isSelected ? 1.1 : 1 }}
              transition={{ duration: 0.5 }}
            >
              {item.icon}
            </motion.div>
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    </motion.div>
  );
}

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPublicRoute = ['/login', '/employee-login'].includes(location.pathname);
  if (isPublicRoute) {
    return <Box>{children}</Box>;
  }

  const drawerContent = (
    <Box className="holo-sidebar" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Section */}
      <Toolbar sx={{ px: 2, py: 4, mb: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <DashboardIcon sx={{ color: '#000', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{
                background: 'linear-gradient(90deg, #FFF, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0.5,
                textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
              }}
            >
              Admin Nexus
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.65rem' }}>
              System V.0.4
            </Typography>
          </Box>
        </motion.div>
      </Toolbar>

      <Divider sx={{ mx: 3, borderColor: 'rgba(255, 215, 0, 0.1)' }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, pt: 3 }}>
        {menuItems.map((item, index) => (
          <AnimatedMenuItem
            key={item.text}
            item={item}
            isSelected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            index={index}
          />
        ))}
      </List>

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <Box
          component={motion.div}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          sx={{
            p: 2,
            borderRadius: '16px',
            background: 'rgba(255, 69, 0, 0.1)',
            border: '1px solid rgba(255, 69, 0, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 69, 0, 0.2)',
              borderColor: '#FF4500',
              boxShadow: '0 0 15px rgba(255, 69, 0, 0.2)'
            }
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255, 69, 0, 0.2)', color: '#FF4500' }}>
            <Logout fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ color: '#FFF', fontWeight: 600 }}>Sign Out</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>End Session</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Global Background for Dashboard */}
      <div className="futuristic-bg" />
      <div className="grid-overlay" />

      {/* Glass AppBar */}
      <AppBar
        data-testid="admin-layout"
        position="fixed"
        className="holo-header"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 'bold', textShadow: '0 0 5px rgba(255, 215, 0, 0.5)' }}>
                {user?.full_name || 'System Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
                LEVEL 5 CLEARANCE
              </Typography>
            </Box>
            <Avatar
              sx={{
                border: '2px solid #FFD700',
                boxShadow: '0 0 10px #FFD700',
                bgcolor: 'transparent',
                color: '#FFD700'
              }}
            >
              {user?.full_name?.charAt(0) || 'A'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', background: 'transparent' }
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', background: 'transparent' }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <ScreenBroadcaster />
      </Box>
    </Box>
  );
}

export default Layout;
