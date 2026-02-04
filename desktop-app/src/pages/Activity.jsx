import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Box,
    CircularProgress,
    IconButton,
    Button,
    Checkbox,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns';
import api from '../services/api';
import { toast } from 'react-toastify';

const MotionTableRow = motion.create(TableRow);

function Activity() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlerts, setSelectedAlerts] = useState([]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await api.get('/alerts/list');
            // Filter for only activity related alerts
            const activityAlerts = response.data.data.filter(alert =>
                ['USER_IDLE', 'LOW_TYPING_SPEED', 'MOUSE_INACTIVE', 'RESTRICTED_APP_DETECTED'].includes(alert.alert_type)
            );
            setAlerts(activityAlerts);
        } catch (error) {
            toast.error('Failed to fetch activity logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            await api.delete(`/alerts/${id}`);
            toast.success('Log deleted');
            fetchActivity();
        } catch (error) {
            toast.error('Failed to delete log');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedAlerts.length} logs?`)) return;
        try {
            await api.post('/alerts/delete-batch', { ids: selectedAlerts });
            toast.success('Logs deleted successfully');
            setSelectedAlerts([]);
            fetchActivity();
        } catch (error) {
            toast.error('Failed to delete logs');
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedAlerts(alerts.map((alert) => alert.id));
        } else {
            setSelectedAlerts([]);
        }
    };

    const handleSelectOne = (event, id) => {
        if (event.target.checked) {
            setSelectedAlerts([...selectedAlerts, id]);
        } else {
            setSelectedAlerts(selectedAlerts.filter((alertId) => alertId !== id));
        }
    };

    const getSeverity = (type) => {
        switch (type) {
            case 'RESTRICTED_APP_DETECTED': return 'error';
            case 'MOUSE_INACTIVE': return 'warning';
            case 'LOW_TYPING_SPEED': return 'warning';
            case 'USER_IDLE': return 'info';
            default: return 'info';
        }
    };

    // Animation variants for container
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
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress sx={{ color: '#b39ddb' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 2 }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight="800"
                            sx={{
                                background: 'linear-gradient(45deg, #FFF, #FFD700)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 0.5,
                                letterSpacing: '1px',
                                textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                            }}
                        >
                            Activity Log
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Monitor suspicious employee behavior and alerts
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {selectedAlerts.length > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleBulkDelete}
                                component={motion.button}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)'
                                }}
                            >
                                Delete Selected ({selectedAlerts.length})
                            </Button>
                        )}
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={fetchActivity}
                            variant="outlined"
                            sx={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                textTransform: 'none',
                                borderRadius: 2,
                                '&:hover': {
                                    borderColor: '#b39ddb',
                                    bgcolor: 'rgba(179, 157, 219, 0.1)'
                                }
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>
            </motion.div>

            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    bgcolor: 'rgba(5, 5, 8, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 215, 0, 0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                            <TableCell padding="checkbox" sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <Checkbox
                                    indeterminate={selectedAlerts.length > 0 && selectedAlerts.length < alerts.length}
                                    checked={alerts.length > 0 && selectedAlerts.length === alerts.length}
                                    onChange={handleSelectAll}
                                    sx={{
                                        color: 'rgba(255,255,255,0.4)',
                                        '&.Mui-checked': { color: '#FFD700' },
                                        '&.MuiCheckbox-indeterminate': { color: '#FFD700' }
                                    }}
                                />
                            </TableCell>
                            {['Time', 'Employee', 'Type', 'Details', 'Status', 'Actions'].map((head) => (
                                <TableCell
                                    key={head}
                                    sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontWeight: 600,
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        textTransform: 'uppercase',
                                        fontSize: '0.75rem',
                                        letterSpacing: '1px'
                                    }}
                                    align={head === 'Actions' ? 'right' : 'left'}
                                >
                                    {head}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody
                        component={motion.tbody}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <AnimatePresence>
                            {alerts.map((alert) => (
                                <MotionTableRow
                                    key={alert.id}
                                    variants={itemVariants}
                                    exit={{ opacity: 0, x: -20 }}
                                    hover
                                    selected={selectedAlerts.includes(alert.id)}
                                    sx={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'background-color 0.2s',
                                        '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.05) !important' },
                                        '&.Mui-selected': { bgcolor: 'rgba(255, 215, 0, 0.08) !important' },
                                        '&:last-child td, &:last-child th': { border: 0 }
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedAlerts.includes(alert.id)}
                                            onChange={(event) => handleSelectOne(event, alert.id)}
                                            sx={{
                                                color: 'rgba(255,255,255,0.4)',
                                                '&.Mui-checked': { color: '#FFD700' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 500 }}>
                                        {alert.alert_time ? format(new Date(alert.alert_time), 'MMM dd, HH:mm:ss') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                {alert.full_name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                {alert.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={alert.alert_type}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                borderRadius: '6px',
                                                bgcolor: getSeverity(alert.alert_type) === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                                                    getSeverity(alert.alert_type) === 'warning' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                                color: getSeverity(alert.alert_type) === 'error' ? '#ff8a80' :
                                                    getSeverity(alert.alert_type) === 'warning' ? '#ffcc80' : '#90caf9',
                                                border: '1px solid',
                                                borderColor: getSeverity(alert.alert_type) === 'error' ? 'rgba(244, 67, 54, 0.2)' :
                                                    getSeverity(alert.alert_type) === 'warning' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {alert.action_attempted}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={alert.status}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor: alert.status === 'BLOCKED' ? 'rgba(244, 67, 54, 0.5)' : 'rgba(255,255,255,0.3)',
                                                color: alert.status === 'BLOCKED' ? '#ff8a80' : 'rgba(255,255,255,0.7)',
                                                fontSize: '0.7rem'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(alert.id)}
                                            sx={{
                                                color: 'rgba(255,255,255,0.4)',
                                                '&:hover': { color: '#ff8a80', bgcolor: 'rgba(244, 67, 54, 0.1)' }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </MotionTableRow>
                            ))}
                        </AnimatePresence>
                        {alerts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <FilterListIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                                        <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>No activity logs found</Typography>
                                    </motion.div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default Activity;
