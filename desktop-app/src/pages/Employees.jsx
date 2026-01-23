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
      // Reload settings to get global values
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
      password: '', // Leave empty to keep unchanged
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
    if (!lastSeen) return 'default';
    const lastSeenDate = new Date(lastSeen);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (lastSeenDate < tenMinutesAgo) return 'error'; // Offline
    if (status === 'WORKING') return 'success';
    if (status === 'BREAK') return 'warning';
    if (status === 'IDLE') return 'info';
    return 'default';
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employees Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenDialog}
          >
            Add Employee
          </Button>
          <IconButton onClick={fetchEmployees} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={newEmployee.full_name}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={newEmployee.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={newEmployee.department}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label={isEditing ? "New Password (leave blank to keep)" : "Initial Password"}
              name="password"
              type="password"
              value={newEmployee.password}
              onChange={handleInputChange}
              required={!isEditing}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddEmployee}
            color="primary"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Update Employee' : 'Create Employee')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Delete Employee?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <b>{employeeToDelete?.full_name}</b>?
            This will permanently remove their account and all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteEmployee} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Specific Settings Dialog */}
      <Dialog
        open={!!selectedEmployeeSettings}
        onClose={() => setSelectedEmployeeSettings(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Settings for: {selectedEmployeeSettings?.full_name}
          <Typography variant="caption" display="block" color="text.secondary">
            Override global system settings for this specific employee.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {settingsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.keys(employeeSettings).map(category => (
                <Box key={category}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize', mb: 1 }}>
                    {category}
                  </Typography>
                  <Grid container spacing={2}>
                    {employeeSettings[category].map(setting => (
                      <Grid item xs={12} sm={6} key={setting.key}>
                        <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{setting.key.replace(/_/g, ' ')}</Typography>
                              <Box sx={{ mt: 1 }}>
                                {setting.type === 'boolean' ? (
                                  <Switch
                                    checked={setting.value}
                                    onChange={(e) => handleUpdateSetting(setting.key, e.target.checked, setting.type)}
                                  />
                                ) : (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type={setting.type === 'number' ? 'number' : 'text'}
                                    value={setting.value}
                                    onChange={(e) => handleUpdateSetting(setting.key, setting.type === 'number' ? parseFloat(e.target.value) : e.target.value, setting.type)}
                                  />
                                )}
                              </Box>
                            </Box>
                            {setting.is_override && (
                              <Tooltip title="Revert to Global">
                                <IconButton size="small" color="error" onClick={() => handleRemoveOverride(setting.key)}>
                                  <RestoreIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Status: {setting.is_override ? (
                              <Chip label="Overridden" color="primary" size="mini" sx={{ height: 16, fontSize: 10 }} />
                            ) : (
                              <Chip label="Global Default" size="mini" sx={{ height: 16, fontSize: 10 }} />
                            )}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEmployeeSettings(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>PC Name</TableCell>
              <TableCell>Google Sheet</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {emp.full_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{emp.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(emp.current_status, emp.last_seen)}
                    color={getStatusColor(emp.current_status, emp.last_seen)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {emp.last_seen
                    ? `${formatDistanceToNow(new Date(emp.last_seen))} ago`
                    : 'Never'
                  }
                </TableCell>
                <TableCell>{emp.department || '-'}</TableCell>
                <TableCell>{emp.pc_name || '-'}</TableCell>
                <TableCell>
                  {emp.google_sheet_url ? (
                    <Typography
                      variant="caption"
                      component="a"
                      href={emp.google_sheet_url}
                      target="_blank"
                      sx={{ color: 'primary.main', textDecoration: 'none' }}
                    >
                      Open Sheet
                    </Typography>
                  ) : <Typography variant="caption" color="text.secondary">Not created</Typography>}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Activity">
                    <IconButton size="small" color="primary" onClick={() => handleViewActivity(emp.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Employee">
                    <IconButton size="small" color="primary" onClick={() => handleEditOpen(emp)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Custom Settings">
                    <IconButton size="small" color="secondary" onClick={() => handleOpenSettings(emp)}>
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
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No employees found</Typography>
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
