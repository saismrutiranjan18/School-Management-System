import api from './axios'

export const fetchStudents      = ()        => api.get('/students').then(r => r.data)
export const fetchStudentById   = (id)      => api.get(`/students/${id}`).then(r => r.data)
export const createStudent      = (data)    => api.post('/students', data).then(r => r.data)
export const updateStudent      = (id,data) => api.put(`/students/${id}`, data).then(r => r.data)
export const setStudentStatus   = (id, is_active) =>
  api.patch(`/students/${id}/status`, { is_active }).then(r => r.data)

export const uploadStudentPhoto = (id, file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post(`/students/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}