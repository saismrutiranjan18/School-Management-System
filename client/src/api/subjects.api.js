import api from './axios'

export const fetchSubjects    = ()        => api.get('/subjects').then(r => r.data)
export const fetchSubjectById = (id)      => api.get(`/subjects/${id}`).then(r => r.data)
export const createSubject    = (data)    => api.post('/subjects', data).then(r => r.data)
export const updateSubject    = (id,data) => api.put(`/subjects/${id}`, data).then(r => r.data)
export const deleteSubject    = (id)      => api.delete(`/subjects/${id}`).then(r => r.data)