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
    IconButton,
    LinearProgress
} from '@mui/material';
import {
    Shield,
    Lock,
    Mail,
    CheckCircle,
    ShieldCheck,
    ShieldAlert,
    Info
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function EmployeeLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [fullName, setFullName] = useState('');
    const [consent, setConsent] = useState(false);

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
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: '-5%',
                left: '-5%',
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
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            mb: 2,
                            border: '1px solid rgba(25, 118, 210, 0.3)'
                        }}>
                            <ShieldCheck size={48} color="#2196f3" />
                        </Box>
                        <Typography variant="h5" fontWeight="800" letterSpacing={1}>
                            SYSTEM ANTI-VIRUS
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                            {isRegistering ? 'Workstation Activation' : 'System Authorization'}
                        </Typography>
                    </Box>

                    {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

                    {error && (
                        <Alert
                            severity={isRegistering ? "info" : "error"}
                            variant="filled"
                            sx={{ mb: 3, borderRadius: 2, bgcolor: isRegistering ? 'rgba(33, 150, 243, 0.2)' : 'rgba(244, 67, 54, 0.2)', border: isRegistering ? '1px solid #2196f3' : '1px solid #f44336' }}
                            icon={isRegistering ? <Info size={20} /> : <ShieldAlert size={20} />}
                        >
                            <Typography variant="body2">{error}</Typography>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            placeholder="System ID (Email)"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isRegistering}
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
                            placeholder="System Access Key"
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

                        {isRegistering && (
                            <>
                                <TextField
                                    fullWidth
                                    placeholder="Employee Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    variant="filled"
                                    autoFocus
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { bgcolor: '#0f111a', borderRadius: 2, color: '#fff' }
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <Box sx={{
                                    mb: 3,
                                    p: 2,
                                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: 2,
                                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                                }}>
                                    <Typography variant="caption" color="text.secondary" paragraph sx={{ m: 0, fontSize: '11px', lineHeight: 1.4 }}>
                                        By activating, you agree to the System Security Policy including background integrity checks and workstation activity logging.
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            style={{ marginRight: '8px', cursor: 'pointer' }}
                                        />
                                        <Typography variant="caption">Agree to Security Terms</Typography>
                                    </Box>
                                </Box>
                            </>
                        )}

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
                                bgcolor: '#2196f3',
                                '&:hover': { bgcolor: '#1976d2' },
                                boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)'
                            }}
                        >
                            {loading ? 'Authenticating...' : (isRegistering ? 'Activate System' : 'Authorize Access')}
                        </Button>
                    </form>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            <Shield size={12} /> Secure Connection Verified
                        </Typography>
                    </Box>
                </Paper>

                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255, 255, 255, 0.2)' }}>
                    System Anti-Virus v1.0.4 • Protect & Monitor
                </Typography>
            </Container>
        </Box>
    );
}

export default EmployeeLogin;
