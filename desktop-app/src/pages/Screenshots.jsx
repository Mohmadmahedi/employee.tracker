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
import GridViewIcon from '@mui/icons-material/GridView';
import api from '../services/api';
import employeeService from '../services/employeeService';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

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

  const commonInputStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#FFF',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: '#FFD700' },
      '&.Mui-focused fieldset': { borderColor: '#FFD700' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
    '& .MuiSelect-icon': { color: '#FFD700' }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="800"
        sx={{
          background: 'linear-gradient(45deg, #FFF, #FFD700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
        }}
      >
        Screenshot History
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: 'rgba(5, 5, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}
        elevation={0}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Select Employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              sx={commonInputStyles}
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
                renderInput={(params) => <TextField {...params} fullWidth sx={commonInputStyles} />}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      ...commonInputStyles,
                      'input': { color: '#FFF' },
                      '.MuiSvgIcon-root': { color: '#FFD700' }
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={fetchScreenshots}
              sx={{
                height: 56,
                background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1rem',
                '&:hover': {
                  background: 'linear-gradient(90deg, #FFC107 0%, #FF6D00 100%)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                }
              }}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress sx={{ color: '#FFD700' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {screenshots.map((s, index) => {
            const empName = employees.find(e => e.id === s.employee_id)?.full_name || 'Unknown';
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      bgcolor: '#0A0B10',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        border: '1px solid #FFD700',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
                      }
                    }}
                    onClick={() => setSelectedImg(`http://10.20.228.168:5000/${s.file_path}`)}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={`http://10.20.228.168:5000/${s.file_path}`}
                      alt="Screenshot"
                      sx={{ backgroundColor: '#000', objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                        p: 2,
                        pt: 4
                      }}
                    >
                      <Typography variant="subtitle2" noWrap sx={{ color: '#FFF', fontWeight: 'bold' }}>{empName}</Typography>
                      <Typography variant="caption" sx={{ color: '#FFD700' }}>
                        {s.screenshot_time ? format(new Date(s.screenshot_time), 'hh:mm:ss a') : 'Unknown Time'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteItem(s.id, e)}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: '#FF4444',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        '&:hover': { bgcolor: 'rgba(255, 68, 68, 0.2)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
          {screenshots.length === 0 && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 4
                }}
              >
                <GridViewIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>No screenshots captured during this period.</Typography>
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
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={() => setSelectedImg(null)}
            sx={{
              position: 'fixed',
              right: 30,
              top: 30,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: '#FFD700', color: '#000' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={handleDeleteScreenshot}
            sx={{
              position: 'fixed',
              right: 90,
              top: 30,
              color: '#FF4444',
              bgcolor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              '&:hover': { bgcolor: '#FF4444', color: '#FFF' }
            }}
          >
            <DeleteIcon />
          </IconButton>
          <Box
            sx={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              border: '2px solid #FFD700',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'
            }}
          >
            <img
              src={selectedImg}
              alt="Full Size"
              style={{ maxHeight: '90vh', maxWidth: '100%', display: 'block' }}
            />
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}

export default Screenshots;
