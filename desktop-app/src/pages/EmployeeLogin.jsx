import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Container,
    Paper,
    TextField,
    Typography,
    Alert,
    InputAdornment,
    LinearProgress
} from '@mui/material';
import {
    Shield,
    Lock,
    Mail,
    ShieldCheck,
    ShieldAlert,
    Info,
    Sparkles,
    User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton';

// Floating particles component
const FloatingParticles = () => {
    const particles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 10,
        size: 2 + Math.random() * 3
    }));

    return (
        <Box className="particles">
            {particles.map((p) => (
                <Box
                    key={p.id}
                    className="particle"
                    sx={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        background: 'rgba(25, 118, 210, 0.4)'
                    }}
                />
            ))}
        </Box>
    );
};

// Animated background orbs
const BackgroundOrbs = () => (
    <>
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(25, 118, 210, 0.15) 0%, transparent 70%)',
                zIndex: 0,
                filter: 'blur(40px)'
            }}
        />
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2
            }}
            style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(63, 81, 181, 0.12) 0%, transparent 70%)',
                zIndex: 0,
                filter: 'blur(40px)'
            }}
        />
    </>
);

function EmployeeLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [fullName, setFullName] = useState('');
    const [consent, setConsent] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const employeeLogin = useAuthStore(state => state.employeeLogin);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isRegistering) {
            if (!fullName.trim()) {
                setError("Full Name is required for system activation");
                setLoading(false);
                return;
            }
            if (!consent) {
                setError("You must agree to the system security terms");
                setLoading(false);
                return;
            }
        }

        try {
            const extraData = isRegistering ? {
                full_name: fullName,
                consent_accepted: true
            } : {};

            const result = await employeeLogin(email, password, extraData);

            if (result.success) {
                if (window.trackerAPI) {
                    window.trackerAPI.startTracking({
                        token: result.token,
                        employeeId: result.employee.id
                    });
                    window.trackerAPI.hideApp();
                }
                navigate('/employee-dashboard');
            } else {
                if (result.error && result.error.includes('requires full name')) {
                    setIsRegistering(true);
                    setError('New workstation detected. Activation required.');
                } else {
                    setError('Invalid login credentials or expired activation key.');
                }
            }
        } catch (err) {
            setError('Access Denied: Connection to security server failed');
        }

        setLoading(false);
    };

    // Animation variants
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

    const iconVariants = {
        initial: { scale: 0, rotate: -180 },
        animate: {
            scale: 1,
            rotate: 0,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.3
            }
        },
        hover: {
            scale: 1.1,
            rotate: 10,
            transition: { duration: 0.3 }
        }
    };

    const inputStyle = {
        bgcolor: 'rgba(15, 17, 26, 0.8)',
        borderRadius: 2,
        color: '#fff',
        border: '1px solid transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: 'rgba(26, 29, 41, 0.9)',
            borderColor: 'rgba(25, 118, 210, 0.2)'
        },
        '&.Mui-focused': {
            borderColor: 'rgba(25, 118, 210, 0.5)',
            boxShadow: '0 0 20px rgba(25, 118, 210, 0.15)'
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0b10 0%, #161822 50%, #0a0b10 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated Backgrounds */}
            <Box className="animated-bg" />
            <FloatingParticles />
            <BackgroundOrbs />

            <Container maxWidth="xs" sx={{ zIndex: 1 }}>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Paper
                        component={motion.div}
                        whileHover={{
                            boxShadow: '0 25px 50px -12px rgba(25, 118, 210, 0.25)',
                            borderColor: 'rgba(25, 118, 210, 0.3)'
                        }}
                        elevation={24}
                        sx={{
                            p: 4,
                            bgcolor: 'rgba(22, 24, 34, 0.8)',
                            backdropFilter: 'blur(20px)',
                            color: '#fff',
                            borderRadius: 4,
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Animated gradient border */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: 'linear-gradient(90deg, transparent, #2196f3, #1976d2, #2196f3, transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'gradientFlow 3s ease infinite',
                                '@keyframes gradientFlow': {
                                    '0%': { backgroundPosition: '100% 0' },
                                    '100%': { backgroundPosition: '-100% 0' }
                                }
                            }}
                        />

                        {/* Header */}
                        <motion.div variants={itemVariants}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <motion.div
                                    variants={iconVariants}
                                    initial="initial"
                                    animate="animate"
                                    whileHover="hover"
                                >
                                    <Box sx={{
                                        display: 'inline-flex',
                                        p: 2.5,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%)',
                                        mb: 2,
                                        border: '1px solid rgba(25, 118, 210, 0.3)',
                                        boxShadow: '0 0 30px rgba(25, 118, 210, 0.3)',
                                        position: 'relative'
                                    }}>
                                        <ShieldCheck size={48} color="#2196f3" />
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 0, 0.5]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeOut'
                                            }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '50%',
                                                border: '2px solid rgba(25, 118, 210, 0.5)'
                                            }}
                                        />
                                    </Box>
                                </motion.div>

                                <Typography
                                    variant="h5"
                                    fontWeight="800"
                                    letterSpacing={1}
                                    sx={{
                                        background: 'linear-gradient(90deg, #1976d2, #2196f3, #1976d2)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        animation: 'gradientText 3s ease infinite',
                                        '@keyframes gradientText': {
                                            '0%': { backgroundPosition: '0% 50%' },
                                            '50%': { backgroundPosition: '100% 50%' },
                                            '100%': { backgroundPosition: '0% 50%' }
                                        },
                                        mb: 0.5
                                    }}
                                >
                                    SYSTEM ANTI-VIRUS
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: 'uppercase',
                                        letterSpacing: 3,
                                        color: 'rgba(255,255,255,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1
                                    }}
                                >
                                    <Sparkles size={12} />
                                    {isRegistering ? 'Workstation Activation' : 'System Authorization'}
                                    <Sparkles size={12} />
                                </Typography>
                            </Box>
                        </motion.div>

                        {/* Loading Bar */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <LinearProgress
                                        sx={{
                                            mb: 2,
                                            borderRadius: 1,
                                            bgcolor: 'rgba(25, 118, 210, 0.2)',
                                            '& .MuiLinearProgress-bar': {
                                                background: 'linear-gradient(90deg, #1976d2, #2196f3, #1976d2)',
                                                backgroundSize: '200% 100%',
                                                animation: 'gradientFlow 1s ease infinite'
                                            }
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Alert
                                        severity={isRegistering ? "info" : "error"}
                                        variant="filled"
                                        sx={{
                                            mb: 3,
                                            borderRadius: 2,
                                            bgcolor: isRegistering
                                                ? 'rgba(33, 150, 243, 0.15)'
                                                : 'rgba(244, 67, 54, 0.15)',
                                            border: isRegistering
                                                ? '1px solid rgba(33, 150, 243, 0.5)'
                                                : '1px solid rgba(244, 67, 54, 0.5)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        icon={isRegistering ? <Info size={20} /> : <ShieldAlert size={20} />}
                                    >
                                        <Typography variant="body2">{error}</Typography>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <motion.div variants={itemVariants}>
                                <TextField
                                    fullWidth
                                    placeholder="System ID (Email)"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    disabled={isRegistering}
                                    variant="filled"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <motion.div
                                                    animate={{
                                                        color: focusedField === 'email' ? '#2196f3' : '#666',
                                                        scale: focusedField === 'email' ? 1.1 : 1
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Mail size={18} />
                                                </motion.div>
                                            </InputAdornment>
                                        ),
                                        disableUnderline: true,
                                        sx: inputStyle
                                    }}
                                    sx={{ mb: 2 }}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <TextField
                                    fullWidth
                                    placeholder="System Access Key"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    variant="filled"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <motion.div
                                                    animate={{
                                                        color: focusedField === 'password' ? '#2196f3' : '#666',
                                                        scale: focusedField === 'password' ? 1.1 : 1
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Lock size={18} />
                                                </motion.div>
                                            </InputAdornment>
                                        ),
                                        disableUnderline: true,
                                        sx: inputStyle
                                    }}
                                    sx={{ mb: 3 }}
                                />
                            </motion.div>

                            {/* Registration Fields */}
                            <AnimatePresence>
                                {isRegistering && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <TextField
                                            fullWidth
                                            placeholder="Employee Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                            variant="filled"
                                            autoFocus
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <motion.div
                                                            animate={{
                                                                color: focusedField === 'name' ? '#2196f3' : '#666',
                                                                scale: focusedField === 'name' ? 1.1 : 1
                                                            }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <User size={18} />
                                                        </motion.div>
                                                    </InputAdornment>
                                                ),
                                                disableUnderline: true,
                                                sx: inputStyle
                                            }}
                                            sx={{ mb: 2 }}
                                        />

                                        <Box sx={{
                                            mb: 3,
                                            p: 2,
                                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: 2,
                                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.04)',
                                                borderColor: 'rgba(25, 118, 210, 0.3)'
                                            }
                                        }}>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                paragraph
                                                sx={{ m: 0, fontSize: '11px', lineHeight: 1.4 }}
                                            >
                                                By activating, you agree to the System Security Policy including background integrity checks and workstation activity logging.
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                                <motion.input
                                                    type="checkbox"
                                                    checked={consent}
                                                    onChange={(e) => setConsent(e.target.checked)}
                                                    style={{
                                                        marginRight: '8px',
                                                        cursor: 'pointer',
                                                        width: 16,
                                                        height: 16,
                                                        accentColor: '#2196f3'
                                                    }}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                />
                                                <Typography variant="caption">Agree to Security Terms</Typography>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={itemVariants}>
                                <AnimatedButton
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    glowColor="rgba(33, 150, 243, 0.5)"
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)'
                                        },
                                        '&.Mui-disabled': {
                                            background: 'rgba(33, 150, 243, 0.3)',
                                            color: 'rgba(255,255,255,0.5)'
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <motion.span
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            Authenticating...
                                        </motion.span>
                                    ) : (
                                        isRegistering ? 'Activate System' : 'Authorize Access'
                                    )}
                                </AnimatedButton>
                            </motion.div>
                        </form>

                        {/* Footer */}
                        <motion.div variants={itemVariants}>
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.5,
                                        color: 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Shield size={12} />
                                    </motion.div>
                                    Secure Connection Verified
                                </Typography>
                            </Box>
                        </motion.div>
                    </Paper>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'center',
                                mt: 2,
                                color: 'rgba(255, 255, 255, 0.15)',
                                letterSpacing: 1
                            }}
                        >
                            System Anti-Virus v1.0.4 • Protect & Monitor
                        </Typography>
                    </motion.div>
                </motion.div>
            </Container>
        </Box>
    );
}

export default EmployeeLogin;
