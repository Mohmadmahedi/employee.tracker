import api from './api';

const settingsService = {
  getGlobalSettings: async () => {
    const response = await api.get('/settings/global');
    return response.data;
  },

  updateGlobalSetting: async (key, value, reason) => {
    const response = await api.put(`/settings/global/${key}`, {
      setting_key: key,
      setting_value: value,
      reason
    });
    return response.data;
  },

  bulkUpdateSettings: async (settings, reason) => {
    const response = await api.post('/settings/global/bulk-update', {
      settings,
      reason
    });
    return response.data;
  },

  getEmployeeSettings: async (employeeId) => {
    const response = await api.get(`/settings/employee/${employeeId}`);
    return response.data;
  },

  setEmployeeSetting: async (employeeId, key, value, dataType, reason) => {
    const response = await api.put(`/settings/employee/${employeeId}/${key}`, {
      setting_key: key,
      setting_value: value,
      data_type: dataType,
      reason
    });
    return response.data;
  },

  removeEmployeeOverride: async (employeeId, settingKey) => {
    const response = await api.delete(`/settings/employee/${employeeId}/override/${settingKey}`);
    return response.data;
  },

  getConfigHistory: async (employeeId = null, limit = 50) => {
    const params = { limit };
    if (employeeId) params.employeeId = employeeId;
    
    const response = await api.get('/settings/history', { params });
    return response.data;
  },

  exportSettings: async () => {
    const response = await api.get('/settings/export');
    return response.data;
  },

  importSettings: async (data) => {
    const response = await api.post('/settings/import', data);
    return response.data;
  }
};

export default settingsService;
