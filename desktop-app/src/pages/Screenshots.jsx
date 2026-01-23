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
  CardMedia,
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
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import employeeService from '../services/employeeService';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [selectedEmployee, selectedDate]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  const handleDeleteScreenshot = async () => {
    if (!selectedImg) return;
    // Extract ID from filename or find in screenshots array
    const screenshot = screenshots.find(s => `http://10.20.228.168:5000/${s.file_path}` === selectedImg);
    if (!screenshot) return;

    if (!window.confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      await api.delete(`/screenshots/${screenshot.id}`);
      toast.success('Screenshot deleted');
      setScreenshots(prev => prev.filter(s => s.id !== screenshot.id));
      setSelectedImg(null);
    } catch (error) {
      toast.error('Failed to delete screenshot');
    }
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this screenshot?')) return;
    try {
      await api.delete(`/screenshots/${id}`);
      toast.success('Screenshot deleted');
      setScreenshots(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      const params = {
        date: format(selectedDate, 'yyyy-MM-dd')
      };
      if (selectedEmployee !== 'all') {
        params.employeeId = selectedEmployee;
      }

      const response = await api.get('/screenshots/list', { params });
      setScreenshots(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch screenshots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">Screenshot History</Typography>

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
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth onClick={fetchScreenshots} sx={{ height: 56 }}>
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
          {screenshots.map((s) => {
            const empName = employees.find(e => e.id === s.employee_id)?.full_name || 'Unknown';
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { transform: 'scale(1.02)', transition: '0.2s' },
                    boxShadow: 2
                  }}
                  onClick={() => setSelectedImg(`http://10.20.228.168:5000/${s.file_path}`)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={`http://10.20.228.168:5000/${s.file_path}`}
                    alt="Screenshot"
                    sx={{ backgroundColor: '#000' }}
                  />
                  <CardContent sx={{ p: 1.5, position: 'relative' }}>
                    <Typography variant="subtitle2" noWrap>{empName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.screenshot_time ? format(new Date(s.screenshot_time), 'hh:mm:ss a') : 'Unknown Time'}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteItem(s.id, e)}
                      sx={{ position: 'absolute', right: 5, top: 5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {screenshots.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>No screenshots found for the selected criteria.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Full Screen Viewer */}
      <Dialog
        open={!!selectedImg}
        onClose={() => setSelectedImg(null)}
        maxWidth="xl"
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedImg(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={handleDeleteScreenshot}
            sx={{ position: 'absolute', right: 56, top: 8, color: 'white', bgcolor: 'rgba(255,0,0,0.5)', '&:hover': { bgcolor: 'rgba(255,0,0,0.7)' } }}
          >
            <DeleteIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
            <img
              src={selectedImg}
              alt="Full Size"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </DialogContent>
        </Box>
      </Dialog>
    </Container>
  );
}

export default Screenshots;
