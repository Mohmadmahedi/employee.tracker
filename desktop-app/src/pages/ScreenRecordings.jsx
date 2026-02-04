import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Paper,
    Box,
    TextField,
    MenuItem,
    CircularProgress,
    Card,
    CardContent,
    Dialog,
    DialogContent,
    IconButton,
    Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import employeeService from '../services/employeeService';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// Get base URL for file serving (strip /api from API_URL)
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://attendance-backend-7yn8.onrender.com/api').replace('/api', '');

function ScreenRecordings() {
    const [recordings, setRecordings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [playingVideo, setPlayingVideo] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRecordings();
    }, [selectedEmployee, selectedDate]);

    const fetchEmployees = async () => {
        try {
            const response = await employeeService.getEmployees();
            setEmployees(response.data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        }
    };



    const handleDeleteRecording = async () => {
        if (!playingVideo) return;
        // Extract ID from filename or find in recordings array
        const recording = recordings.find(r => `${API_BASE_URL}/${r.file_path}` === playingVideo);
        if (!recording) return;

        if (!window.confirm('Are you sure you want to delete this recording?')) return;

        try {
            await api.delete(`/recordings/${recording.id}`);
            toast.success('Recording deleted');
            setRecordings(prev => prev.filter(r => r.id !== recording.id));
            setPlayingVideo(null);
        } catch (error) {
            toast.error('Failed to delete recording');
        }
    };

    const handleDeleteItem = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this screen recording?')) return;
        try {
            await api.delete(`/recordings/${id}`);
            toast.success('Recording deleted');
            setRecordings(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const params = {
                date: format(selectedDate, 'yyyy-MM-dd')
            };
            if (selectedEmployee !== 'all') {
                params.employeeId = selectedEmployee;
            }

            const response = await api.get('/recordings/list', { params });
            setRecordings(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch recordings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">Screen Recording History</Typography>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="Select Employee"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                            <MenuItem value="all">All Employees</MenuItem>
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Select Date"
                                value={selectedDate}
                                onChange={(newValue) => setSelectedDate(newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button variant="contained" fullWidth onClick={fetchRecordings} sx={{ height: 56 }}>
                            Apply Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {recordings.map((r) => {
                        const empName = employees.find(e => e.id === r.employee_id)?.full_name || 'Unknown';
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={r.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { transform: 'scale(1.02)', transition: '0.2s' },
                                        boxShadow: 2,
                                        position: 'relative'
                                    }}
                                    onClick={() => setPlayingVideo(`${API_BASE_URL}/${r.file_path}`)}
                                >
                                    <Box sx={{ position: 'relative', height: 160, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PlayCircleOutlineIcon sx={{ fontSize: 60, color: 'white', opacity: 0.8 }} />
                                    </Box>
                                    <CardContent sx={{ p: 1.5, position: 'relative' }}>
                                        <Typography variant="subtitle2" noWrap>{empName}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {r.recording_time ? format(new Date(r.recording_time), 'hh:mm:ss a') : 'Unknown Time'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                {r.duration_sec ? `${r.duration_sec}s` : ''}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => handleDeleteItem(r.id, e)}
                                            sx={{ position: 'absolute', right: 5, top: 5 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                    {recordings.length === 0 && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                                <Typography>No recordings found for the selected criteria.</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Video Player Dialog */}
            <Dialog
                open={!!playingVideo}
                onClose={() => setPlayingVideo(null)}
                maxWidth="lg"
                fullWidth
            >
                <Box sx={{ position: 'relative', bgcolor: '#000' }}>
                    <IconButton
                        onClick={() => setPlayingVideo(null)}
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 1, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <IconButton
                        onClick={handleDeleteRecording}
                        sx={{ position: 'absolute', right: 56, top: 8, color: 'white', zIndex: 1, bgcolor: 'rgba(255,0,0,0.5)', '&:hover': { bgcolor: 'rgba(255,0,0,0.7)' } }}
                    >
                        <DeleteIcon />
                    </IconButton>
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center' }}>
                        <video
                            src={playingVideo}
                            controls
                            autoPlay
                            crossOrigin="anonymous"
                            style={{ maxWidth: '100%', maxHeight: '80vh' }}
                        />
                    </DialogContent>
                </Box>
            </Dialog>
        </Container>
    );
}

export default ScreenRecordings;
