import api from './api';

const employeeService = {
    getEmployees: async () => {
        const response = await api.get('/admin/employees');
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getAttendance: async (employeeId, date) => {
        const response = await api.get(`/attendance/daily/${date}`, { params: { employeeId } });
        return response.data;
    },

    addEmployee: (data) => {
        return api.post('/admin/employees', data);
    },

    deleteEmployee: (id) => {
        return api.delete(`/admin/employees/${id}`);
    },

    updateEmployee: (id, data) => {
        return api.put(`/admin/employees/${id}`, data);
    }
};

export default employeeService;
