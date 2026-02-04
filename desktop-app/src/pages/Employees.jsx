import { useNavigate } from 'react-router-dom';
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
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { DialogContentText, InputAdornment } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import employeeService from '../services/employeeService';
import settingsService from '../services/settingsService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    password: '',
    department: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeSettings, setSelectedEmployeeSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [employeeSettings, setEmployeeSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = (employeeId) => {
    navigate(`/live-monitoring?employeeId=${employeeId}`);
  };

  const handleOpenSettings = async (employee) => {
    try {
      setSelectedEmployeeSettings(employee);
      setSettingsLoading(true);
      const response = await settingsService.getEmployeeSettings(employee.id);
      setEmployeeSettings(response.data);
    } catch (error) {
      toast.error('Failed to load employee settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSetting = async (key, value, type) => {
    try {
      await settingsService.setEmployeeSetting(selectedEmployeeSettings.id, key, value, type, 'Admin updated specific setting');
      setEmployeeSettings(prev => {
        const newSettings = { ...prev };
        Object.keys(newSettings).forEach(cat => {
          const setting = newSettings[cat].find(s => s.key === key);
          if (setting) {
            setting.value = value;
            setting.is_override = true;
          }
        });
        return newSettings;
      });
      toast.success('Setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const handleRemoveOverride = async (key) => {
    try {
      await settingsService.removeEmployeeOverride(selectedEmployeeSettings.id, key);
      const response = await settingsService.getEmployeeSettings(selectedEmployeeSettings.id);
      setEmployeeSettings(response.data);
      toast.success('Reverted to global setting');
    } catch (error) {
      toast.error('Failed to revert setting');
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const handleOpenDeleteConfirm = (e, employee) => {
    e.stopPropagation();
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  const handleDeleteEmployee = async () => {
    try {
      if (!employeeToDelete) return;
      await employeeService.deleteEmployee(employeeToDelete.id);
      toast.success('Employee deleted successfully');
      setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
      handleCloseDeleteConfirm();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleOpenDialog = () => {
    setIsEditing(false);
    setNewEmployee({ full_name: '', email: '', password: '', department: '' });
    setOpenDialog(true);
  };

  const handleEditOpen = (emp) => {
    setIsEditing(true);
    setEditingId(emp.id);
    setNewEmployee({
      full_name: emp.full_name,
      email: emp.email,
      password: '',
      department: emp.department || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewEmployee({ full_name: '', email: '', password: '', department: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.full_name || !newEmployee.email) {
      toast.error('Name and Email are required');
      return;
    }

    if (!isEditing && !newEmployee.password) {
      toast.error('Password is required for new employees');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await employeeService.updateEmployee(editingId, newEmployee);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.addEmployee(newEmployee);
        toast.success('Employee added successfully');
      }
      handleCloseDialog();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const getStatusColor = (status, lastSeen) => {
    if (!lastSeen) return '#9e9e9e'; // Grey
    const lastSeenDate = new Date(lastSeen);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (lastSeenDate < tenMinutesAgo) return '#F44336'; // Red
    if (status === 'WORKING') return '#00E676'; // Bright Green
    if (status === 'BREAK') return '#FFC107'; // Amber
    if (status === 'IDLE') return '#29B6F6'; // Light Blue
    return '#9e9e9e';
  };

  const getStatusLabel = (status, lastSeen) => {
    if (!lastSeen) return 'NEVER SEEN';
    const lastSeenDate = new Date(lastSeen);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (lastSeenDate < tenMinutesAgo) return 'OFFLINE';
    return status || 'ONLINE';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="800"
          sx={{
            background: 'linear-gradient(45deg, #FFF, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}
        >
          Employees Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#FFD700' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(0,0,0,0.5)',
                borderRadius: '12px',
                color: '#FFF',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                '& fieldset': { border: 'none' },
                '& input::placeholder': { color: 'rgba(255,255,255,0.5)' }
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '12px',
              '&:hover': {
                background: 'linear-gradient(90deg, #FFC107 0%, #FF6D00 100%)',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
              }
            }}
          >
            Add Employee
          </Button>
          <IconButton
            onClick={fetchEmployees}
            sx={{
              color: '#FFD700',
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.2)' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Add/Edit Employee Dialog - Dark Theme */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0B10',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 0 30px rgba(0,0,0,0.8)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isEditing ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={newEmployee.full_name}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { color: '#FFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: '#FFD700' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={newEmployee.email}
              onChange={handleInputChange}
              required
              sx={{ '& .MuiOutlinedInput-root': { color: '#FFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: '#FFD700' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
            />
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={newEmployee.department}
              onChange={handleInputChange}
              sx={{ '& .MuiOutlinedInput-root': { color: '#FFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: '#FFD700' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
            />
            <TextField
              fullWidth
              label={isEditing ? "New Password (leave blank to keep)" : "Initial Password"}
              name="password"
              type="password"
              value={newEmployee.password}
              onChange={handleInputChange}
              required={!isEditing}
              sx={{ '& .MuiOutlinedInput-root': { color: '#FFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: '#FFD700' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddEmployee}
            sx={{
              background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
              color: '#000',
              fontWeight: 'bold',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(90deg, #FFC107 0%, #FF6D00 100%)',
              }
            }}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Update Employee' : 'Create Employee')}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: 'rgba(5, 5, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
              {['Employee', 'Status', 'Last Seen', 'Department', 'PC Name', 'Google Sheet', 'Actions'].map((head) => (
                <TableCell key={head} sx={{ color: '#FFD700', borderBottom: '1px solid rgba(255, 215, 0, 0.1)', fontWeight: 'bold' }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow
                key={emp.id}
                hover
                sx={{
                  '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.03) !important' },
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{
                      mr: 2,
                      bgcolor: 'rgba(255, 215, 0, 0.1)',
                      color: '#FFD700',
                      border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}>
                      {emp.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#FFF' }}>{emp.full_name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>{emp.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Chip
                    label={getStatusLabel(emp.current_status, emp.last_seen)}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(emp.current_status, emp.last_seen)}20`,
                      color: getStatusColor(emp.current_status, emp.last_seen),
                      border: `1px solid ${getStatusColor(emp.current_status, emp.last_seen)}40`,
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {emp.last_seen
                    ? `${formatDistanceToNow(new Date(emp.last_seen))} ago`
                    : 'Never'
                  }
                </TableCell>
                <TableCell sx={{ color: '#FFF', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{emp.department || '-'}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>{emp.pc_name || '-'}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {emp.google_sheet_url ? (
                    <Typography
                      variant="caption"
                      component="a"
                      href={emp.google_sheet_url}
                      target="_blank"
                      sx={{ color: '#FFD700', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Open Sheet
                    </Typography>
                  ) : <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Not created</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Tooltip title="View Activity">
                    <IconButton size="small" sx={{ color: '#00E5FF' }} onClick={() => handleViewActivity(emp.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Employee">
                    <IconButton size="small" sx={{ color: '#FFD700' }} onClick={() => handleEditOpen(emp)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Custom Settings">
                    <IconButton size="small" sx={{ color: '#AB47BC' }} onClick={() => handleOpenSettings(emp)}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Employee">
                    <IconButton size="small" color="error" onClick={(e) => handleOpenDeleteConfirm(e, emp)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                    No personnel records found in the database.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Employees;
