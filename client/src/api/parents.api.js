import api from './axios'

export const fetchParents     = ()        => api.get('/parents').then(r => r.data)
export const fetchParentById  = (id)      => api.get(`/parents/${id}`).then(r => r.data)
export const createParent     = (data)    => api.post('/parents', data).then(r => r.data)
export const updateParent     = (id,data) => api.put(`/parents/${id}`, data).then(r => r.data)
export const setParentStatus  = (id, is_active) =>
  api.patch(`/parents/${id}/status`, { is_active }).then(r => r.data)