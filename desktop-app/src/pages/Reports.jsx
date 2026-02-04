import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent,
  Box, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, isValid } from 'date-fns';

function Reports() {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: 'all',
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
    endDate: new Date()
  });
  const [summary, setSummary] = useState({ presentDays: 0, totalHours: 0, lateDays: 0 });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees');
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (!isValid(filters.startDate) || !isValid(filters.endDate)) {
        return;
      }

      // Format dates for API (YYYY-MM-DD)
      const params = {
        employeeId: filters.employeeId,
        startDate: format(filters.startDate, 'yyyy-MM-dd'),
        endDate: format(filters.endDate, 'yyyy-MM-dd')
      };

      const [summaryRes, reportRes] = await Promise.all([
        api.get('/reports/summary', { params }),
        api.get('/reports/attendance', { params })
      ]);

      const stats = summaryRes.data.data || {};
      setSummary({
        presentDays: stats.present_days || 0,
        totalHours: stats.total_hours || 0,
        lateDays: stats.late_days || 0
      });
      setReportData(Array.isArray(reportRes.data.data) ? reportRes.data.data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load report data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    const headers = ['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const rows = reportData.map(row => [
      format(new Date(row.attendance_date), 'yyyy-MM-dd'),
      row.employee_name,
      row.department || '-',
      row.clock_in_time ? format(new Date(row.clock_in_time), 'HH:mm:ss') : '-',
      row.clock_out_time ? format(new Date(row.clock_out_time), 'HH:mm:ss') : '-',
      row.working_hours,
      row.late_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return;

    const doc = new jsPDF();
    // Use a dark background in PDF if desired, but standard white is usually better for print.
    // We'll keep standard white for PDF readability.

    // Title
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 22);

    // Subtext (Date Range)
    doc.setFontSize(11);
    doc.text(`Period: ${format(filters.startDate, 'MMM dd, yyyy')} - ${format(filters.endDate, 'MMM dd, yyyy')}`, 14, 30);

    // Table
    const tableColumn = ['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Hrs', 'Status'];
    const tableRows = [];

    reportData.forEach(row => {
      const reportRow = [
        format(new Date(row.attendance_date), 'MMM dd, yyyy'),
        row.employee_name,
        row.department || '-',
        row.clock_in_time ? format(new Date(row.clock_in_time), 'hh:mm a') : '-',
        row.clock_out_time ? format(new Date(row.clock_out_time), 'hh:mm a') : '-',
        row.working_hours,
        row.late_status
      ];
      tableRows.push(reportRow);
    });

    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 215, 0], textColor: 0 } // Gold Header, Black Text
    });

    doc.save(`attendance_report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          background: 'linear-gradient(45deg, #FFF, #FFD700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          fontWeight: 800
        }}
      >
        Attendance Reports
      </Typography>

      {/* Filters */}
      <Card
        sx={{
          mb: 4,
          p: 2,
          bgcolor: 'rgba(5, 5, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Employee</InputLabel>
              <Select
                value={filters.employeeId}
                label="Employee"
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                sx={{
                  color: '#FFF',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 215, 0, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
                  '.MuiSvgIcon-root': { color: '#FFD700' }
                }}
              >
                <MenuItem value="all">All Employees</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      input: { color: '#FFF' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      fieldset: { borderColor: 'rgba(255, 215, 0, 0.3)' },
                      '&:hover fieldset': { borderColor: '#FFD700' },
                      '.MuiSvgIcon-root': { color: '#FFD700' }
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      input: { color: '#FFF' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      fieldset: { borderColor: 'rgba(255, 215, 0, 0.3)' },
                      '&:hover fieldset': { borderColor: '#FFD700' },
                      '.MuiSvgIcon-root': { color: '#FFD700' }
                    }
                  }
                }}
              />
            </Grid>
          </LocalizationProvider>
        </Grid>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(5,5,8,0.9) 0%, rgba(20,20,30,0.9) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: 4,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)'
            }}
          >
            <CardContent>
              <Typography sx={{ color: '#00E5FF' }} gutterBottom>Total Present Days</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFF' }}>{summary.presentDays}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(5,5,8,0.9) 0%, rgba(20,20,30,0.9) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: 4,
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)'
            }}
          >
            <CardContent>
              <Typography sx={{ color: '#FFD700' }} gutterBottom>Total Working Hours</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFF' }}>{summary.totalHours} <span style={{ fontSize: '1rem' }}>hrs</span></Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(5,5,8,0.9) 0%, rgba(20,20,30,0.9) 100%)',
              border: '1px solid rgba(255, 69, 0, 0.3)',
              borderRadius: 4,
              boxShadow: '0 0 20px rgba(255, 69, 0, 0.1)'
            }}
          >
            <CardContent>
              <Typography sx={{ color: '#FF4500' }} gutterBottom>Late Arrivals</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFF' }}>{summary.lateDays}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {reportData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                p: 2,
                height: '100%',
                bgcolor: 'rgba(5, 5, 8, 0.8)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#FFF' }}>Check-in Activity & Working Hours</Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={[...reportData].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="attendance_date"
                      tickFormatter={(str) => format(new Date(str), 'MMM dd')}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', borderColor: '#FFD700', borderRadius: '8px' }}
                      itemStyle={{ color: '#FFD700' }}
                      labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                      formatter={(value) => [`${value} hrs`, 'Working Hours']}
                    />
                    <Legend />
                    <Bar dataKey="working_hours" name="Working Hours" fill="#FFD700" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 2,
                height: '100%',
                bgcolor: 'rgba(5, 5, 8, 0.8)',
                border: '1px solid rgba(255, 215, 0, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#FFF' }}>Attendance Status</Typography>
              <Box sx={{ height: 300, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'On Time', value: reportData.filter(r => r.late_status === 'On Time').length },
                        { name: 'Late', value: reportData.filter(r => r.late_status === 'Late').length }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#00E676" />
                      <Cell fill="#FF4500" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#FFD700' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#FFF' }}>Detailed Log</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
            disabled={reportData.length === 0}
            sx={{
              mr: 2,
              background: '#000',
              border: '1px solid #FFD700',
              color: '#FFD700',
              '&:hover': { background: 'rgba(255, 215, 0, 0.1)' }
            }}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            sx={{
              background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': { background: 'linear-gradient(90deg, #FFC107 0%, #FF6D00 100%)' }
            }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Detailed Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: 'rgba(5, 5, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 215, 0, 0.05)' }}>
              {['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Total Hours', 'Status'].map(head => (
                <TableCell key={head} sx={{ color: '#FFD700', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: 'none' }}>
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              reportData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.05) !important' },
                    cursor: 'pointer'
                  }}
                >
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {format(new Date(row.attendance_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell sx={{ color: '#FFF', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.employee_name}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.department || '-'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.clock_in_time ? format(new Date(row.clock_in_time), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.clock_out_time ? format(new Date(row.clock_out_time), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell sx={{ color: '#FFF', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.working_hours}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Chip
                      label={row.late_status === 'Late' ? 'Late' : 'On Time'}
                      size="small"
                      sx={{
                        bgcolor: row.late_status === 'Late' ? 'rgba(255, 69, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                        color: row.late_status === 'Late' ? '#FF4500' : '#00E676',
                        border: `1px solid ${row.late_status === 'Late' ? '#FF4500' : '#00E676'}`,
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Reports;
