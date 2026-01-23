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
    Checkbox
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import api from '../services/api';
import { toast } from 'react-toastify';

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Activity Log</Typography>
                <Box>
                    {selectedAlerts.length > 0 && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleBulkDelete}
                            sx={{ mr: 2 }}
                        >
                            Delete Selected ({selectedAlerts.length})
                        </Button>
                    )}
                    <Button startIcon={<RefreshIcon />} onClick={fetchActivity}>Refresh</Button>
                </Box>
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedAlerts.length > 0 && selectedAlerts.length < alerts.length}
                                    checked={alerts.length > 0 && selectedAlerts.length === alerts.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {alerts.map((alert) => (
                            <TableRow key={alert.id} hover selected={selectedAlerts.includes(alert.id)}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedAlerts.includes(alert.id)}
                                        onChange={(event) => handleSelectOne(event, alert.id)}
                                    />
                                </TableCell>
                                <TableCell>{alert.alert_time ? format(new Date(alert.alert_time), 'MMM dd, HH:mm:ss') : '-'}</TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2">{alert.full_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{alert.email}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={alert.alert_type}
                                        color={getSeverity(alert.alert_type)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{alert.action_attempted}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={alert.status}
                                        color={alert.status === 'BLOCKED' ? 'error' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="error" onClick={() => handleDelete(alert.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {alerts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">No activity logs found</Typography>
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
