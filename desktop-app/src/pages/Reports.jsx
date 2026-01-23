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
      headStyles: { fillColor: [25, 118, 210] } // Material UI Primary Blue
    });

    doc.save(`attendance_report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                value={filters.employeeId}
                label="Employee"
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
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
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
          </LocalizationProvider>
        </Grid>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Present Days</Typography>
              <Typography variant="h4">{summary.presentDays}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Working Hours</Typography>
              <Typography variant="h4">{summary.totalHours} hrs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Late Arrivals</Typography>
              <Typography variant="h4">{summary.lateDays}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {reportData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Check-in Activity & Working Hours</Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={[...reportData].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="attendance_date"
                      tickFormatter={(str) => format(new Date(str), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                      formatter={(value) => [`${value} hrs`, 'Working Hours']}
                    />
                    <Legend />
                    <Bar dataKey="working_hours" name="Working Hours" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Attendance Status</Typography>
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
                      <Cell fill="#4caf50" />
                      <Cell fill="#f44336" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Detailed Log</Typography>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
            disabled={reportData.length === 0}
            sx={{ mr: 2 }}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Detailed Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No data found</TableCell>
              </TableRow>
            ) : (
              reportData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{format(new Date(row.attendance_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{row.employee_name}</TableCell>
                  <TableCell>{row.department || '-'}</TableCell>
                  <TableCell>
                    {row.clock_in_time ? format(new Date(row.clock_in_time), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell>
                    {row.clock_out_time ? format(new Date(row.clock_out_time), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell>{row.working_hours}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.late_status === 'Late' ? 'Late' : 'On Time'}
                      color={row.late_status === 'Late' ? 'error' : 'success'}
                      size="small"
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
