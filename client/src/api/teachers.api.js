import api from './axios'

export const fetchTeachers     = ()        => api.get('/teachers').then(r => r.data)
export const fetchTeacherById  = (id)      => api.get(`/teachers/${id}`).then(r => r.data)
export const createTeacher     = (data)    => api.post('/teachers', data).then(r => r.data)
export const updateTeacher     = (id,data) => api.put(`/teachers/${id}`, data).then(r => r.data)
export const setTeacherStatus  = (id, is_active) =>
  api.patch(`/teachers/${id}/status`, { is_active }).then(r => r.data)