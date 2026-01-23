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
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import api from '../services/api';
import { toast } from 'react-toastify';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({ open: false, alert: null, notes: '' });
  const [selectedAlerts, setSelectedAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts/list');
      // Filter out activity alerts (they belong in Activity.jsx)
      const securityAlerts = response.data.data.filter(alert =>
        ['UNINSTALL_ATTEMPT', 'RESTRICTED_APP_DETECTED', 'PROCESS_KILL', 'SERVICE_STOP'].includes(alert.alert_type)
      );
      setAlerts(securityAlerts);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReview = async (status) => {
    try {
      await api.patch(`/alerts/${reviewDialog.alert.id}/review`, {
        status,
        admin_notes: reviewDialog.notes
      });
      toast.success('Alert reviewed');
      setReviewDialog({ open: false, alert: null, notes: '' });
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };



  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await api.delete(`/alerts/${id}`);
      toast.success('Alert deleted');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedAlerts.length} alerts?`)) return;
    try {
      console.log('Deleting IDs:', selectedAlerts);
      const response = await api.post('/alerts/delete-batch', { ids: selectedAlerts });
      toast.success(response.data.message);
      setSelectedAlerts([]);
      fetchAlerts();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete alerts');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const ids = alerts.map((alert) => alert.id);
      console.log('Selected All IDs:', ids);
      setSelectedAlerts(ids);
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
      case 'UNINSTALL_ATTEMPT': return 'error';
      case 'PROCESS_KILL': return 'error';
      case 'SERVICE_STOP': return 'warning';
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
        <Typography variant="h4" fontWeight="bold">Security Alerts</Typography>
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
          <Button startIcon={<RefreshIcon />} onClick={fetchAlerts}>Refresh</Button>
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
              <TableCell>Action Attempted</TableCell>
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
                    color={alert.status === 'BLOCKED' ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {alert.status === 'PENDING' || !alert.reviewed_at ? (
                    <Button
                      size="small"
                      onClick={() => setReviewDialog({ open: true, alert, notes: '' })}
                    >
                      Review
                    </Button>
                  ) : (
                    <Tooltip title={`Notes: ${alert.admin_notes || 'None'}`}>
                      <IconButton size="small"><InfoIcon color="primary" /></IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" color="error" onClick={() => handleDelete(alert.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No security alerts found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ ...reviewDialog, open: false })}>
        <DialogTitle>Review Security Alert</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Type: {reviewDialog.alert?.alert_type}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Action: {reviewDialog.alert?.action_attempted}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes"
            value={reviewDialog.notes}
            onChange={(e) => setReviewDialog({ ...reviewDialog, notes: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>Cancel</Button>
          <Button onClick={() => handleReview('ALLOWED')} color="warning">Allow Action</Button>
          <Button onClick={() => handleReview('BLOCKED')} color="error" variant="contained">Block Action</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Alerts;
