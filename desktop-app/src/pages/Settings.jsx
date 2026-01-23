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

  const renderSettingField = (category, setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={setting.value}
                onChange={(e) => handleChange(category, setting.key, e.target.checked)}
              />
            }
            label={setting.description || setting.key}
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
          />
        );
      
      case 'string':
        if (setting.key.includes('interval') || setting.key.includes('frequency')) {
          return (
            <FormControl fullWidth size="small">
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
          />
        );
    }
  };

  const renderCategory = (category, settingsList) => {
    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {category} Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {settingsList.map((setting) => (
              <Grid item xs={12} md={6} key={setting.key}>
                <Box sx={{ mb: 2 }}>
                  {renderSettingField(category, setting)}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            component="label"
            sx={{ mr: 1 }}
          >
            Import
            <input type="file" hidden accept=".json" />
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. Don't forget to save!
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
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
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
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
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Configure screenshot capture behavior for all employee desktop applications.
              </Typography>
              {renderCategory('screenshot', settings.screenshot)}
            </Box>
          )}

          {tab === 2 && settings.monitoring && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Configure activity monitoring and tracking parameters.
              </Typography>
              {renderCategory('monitoring', settings.monitoring)}
              {settings.time && renderCategory('time', settings.time)}
            </Box>
          )}

          {tab === 3 && settings.security && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Security and anti-tamper protection settings.
              </Typography>
              {renderCategory('security', settings.security)}
            </Box>
          )}

          {tab === 4 && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                External integrations (Google Sheets, Email, etc.)
              </Typography>
              {settings.integration && renderCategory('integration', settings.integration)}
              {settings.email && renderCategory('email', settings.email)}
              {settings.data && renderCategory('data', settings.data)}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Alert severity="info">
        <strong>Real-time Updates:</strong> All changes are automatically pushed to employee desktop applications via WebSocket.
        Employees will receive updated settings within seconds.
      </Alert>
    </Container>
  );
}

export default Settings;
