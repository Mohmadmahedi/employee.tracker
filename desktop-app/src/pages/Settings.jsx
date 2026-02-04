import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { toast } from 'react-toastify';
import settingsService from '../services/settingsService';

function Settings() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getGlobalSettings();
      setSettings(response.data);
      setOriginalSettings(JSON.parse(JSON.stringify(response.data)));
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, key, value) => {
    const newSettings = { ...settings };
    const setting = newSettings[category].find(s => s.key === key);
    if (setting) {
      setting.value = value;
    }
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const changedSettings = [];

      Object.keys(settings).forEach(category => {
        settings[category].forEach(setting => {
          const original = originalSettings[category]?.find(s => s.key === setting.key);
          if (original && original.value !== setting.value) {
            changedSettings.push({
              key: setting.key,
              value: setting.value
            });
          }
        });
      });

      if (changedSettings.length === 0) {
        toast.info('No changes to save');
        return;
      }

      await settingsService.bulkUpdateSettings(changedSettings, 'Admin updated settings from dashboard');

      toast.success(`${changedSettings.length} settings saved successfully!`);
      setHasChanges(false);
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  const handleExport = async () => {
    try {
      const response = await settingsService.exportSettings();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString()}.json`;
      a.click();
      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error('Failed to export settings');
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

  const renderSettingField = (category, setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={setting.value}
                onChange={(e) => handleChange(category, setting.key, e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#FFD700',
                    '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#FFD700',
                  },
                  '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' }
                }}
              />
            }
            label={<Typography sx={{ color: '#FFF' }}>{setting.description || setting.key}</Typography>}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={setting.description || setting.key}
            value={setting.value}
            onChange={(e) => handleChange(category, setting.key, parseFloat(e.target.value))}
            variant="outlined"
            size="small"
            sx={commonInputStyles}
          />
        );

      case 'string':
        if (setting.key.includes('interval') || setting.key.includes('frequency')) {
          return (
            <FormControl fullWidth size="small" sx={commonInputStyles}>
              <InputLabel>{setting.description || setting.key}</InputLabel>
              <Select
                value={setting.value}
                label={setting.description || setting.key}
                onChange={(e) => handleChange(category, setting.key, e.target.value)}
              >
                <MenuItem value="realtime">Real-time</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
              </Select>
            </FormControl>
          );
        }
        return (
          <TextField
            fullWidth
            label={setting.description || setting.key}
            value={setting.value}
            onChange={(e) => handleChange(category, setting.key, e.target.value)}
            variant="outlined"
            size="small"
            sx={commonInputStyles}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={setting.description || setting.key}
            value={JSON.stringify(setting.value)}
            onChange={(e) => {
              try {
                handleChange(category, setting.key, JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON
              }
            }}
            variant="outlined"
            size="small"
            multiline
            sx={commonInputStyles}
          />
        );
    }
  };

  const renderCategory = (category, settingsList) => {
    return (
      <Accordion
        defaultExpanded
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          color: '#FFF',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: '12px !important',
          mb: 2,
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#FFD700' }} />}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize', color: '#FFD700', fontWeight: 'bold' }}>
            {category} Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {settingsList.map((setting) => (
              <Grid item xs={12} md={6} key={setting.key}>
                <Box sx={{ mb: 2 }}>
                  {renderSettingField(category, setting)}
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'rgba(255,255,255,0.4)' }}>
                    Key: {setting.key}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            background: 'linear-gradient(45deg, #FFF, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            fontWeight: 800
          }}
        >
          System Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1, borderColor: '#FFD700', color: '#FFD700', '&:hover': { borderColor: '#FFF', bgcolor: 'rgba(255,215,0,0.1)' } }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            component="label"
            sx={{ mr: 1, borderColor: '#FFD700', color: '#FFD700', '&:hover': { borderColor: '#FFF', bgcolor: 'rgba(255,215,0,0.1)' } }}
          >
            Import
            <input type="file" hidden accept=".json" />
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert
          severity="warning"
          sx={{ mb: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#FFB74D', border: '1px solid rgba(255, 152, 0, 0.3)' }}
        >
          You have unsaved changes. Don't forget to save!
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: 'rgba(5, 5, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.1)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#FFD700' },
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
              '& .MuiTab-root.Mui-selected': { color: '#FFD700' }
            }}
          >
            <Tab label="All Settings" />
            <Tab label="Screenshot" />
            <Tab label="Monitoring" />
            <Tab label="Security" />
            <Tab label="Integration" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)' }}>
                Control all desktop application behavior from here. Changes will be pushed to all employee apps in real-time.
              </Typography>

              {Object.keys(settings).map((category) => (
                <Box key={category} sx={{ mb: 2 }}>
                  {renderCategory(category, settings[category])}
                </Box>
              ))}
            </Box>
          )}

          {tab === 1 && settings.screenshot && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)' }}>
                Configure screenshot capture behavior for all employee desktop applications.
              </Typography>
              {renderCategory('screenshot', settings.screenshot)}
            </Box>
          )}

          {tab === 2 && settings.monitoring && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)' }}>
                Configure activity monitoring and tracking parameters.
              </Typography>
              {renderCategory('monitoring', settings.monitoring)}
              {settings.time && renderCategory('time', settings.time)}
            </Box>
          )}

          {tab === 3 && settings.security && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)' }}>
                Security and anti-tamper protection settings.
              </Typography>
              {renderCategory('security', settings.security)}
            </Box>
          )}

          {tab === 4 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.6)' }}>
                External integrations (Google Sheets, Email, etc.)
              </Typography>
              {settings.integration && renderCategory('integration', settings.integration)}
              {settings.email && renderCategory('email', settings.email)}
              {settings.data && renderCategory('data', settings.data)}
            </Box>
          )}

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              disabled={!hasChanges || saving}
              sx={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#FFF', bgcolor: 'rgba(255,255,255,0.05)' } }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
              sx={{
                background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
                color: '#000',
                fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(90deg, #FFC107 0%, #FF6D00 100%)' }
              }}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Alert
        severity="info"
        sx={{
          bgcolor: 'rgba(33, 150, 243, 0.1)',
          color: '#64B5F6',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          '& .MuiAlert-icon': { color: '#64B5F6' }
        }}
      >
        <strong>Real-time Updates:</strong> All changes are automatically pushed to employee desktop applications via WebSocket.
        Employees will receive updated settings within seconds.
      </Alert>
    </Container>
  );
}

export default Settings;
