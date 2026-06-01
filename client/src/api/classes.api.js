import api from './axios'

export const fetchClasses       = ()        => api.get('/classes').then(r => r.data)
export const fetchClassById     = (id)      => api.get(`/classes/${id}`).then(r => r.data)
export const fetchClassSubjects = (id)      => api.get(`/classes/${id}/subjects`).then(r => r.data)
export const createClass        = (data)    => api.post('/classes', data).then(r => r.data)
export const updateClass        = (id,data) => api.put(`/classes/${id}`, data).then(r => r.data)
export const deleteClass        = (id)      => api.delete(`/classes/${id}`).then(r => r.data)