import api from './axios'
export const fetchDashboard = () => api.get('/analytics/dashboard').then(r => r.data)