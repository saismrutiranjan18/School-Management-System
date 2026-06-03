import api from './axios'

export const fetchExams      = (class_id) => api.get('/exams', { params: { class_id } }).then(r => r.data)
export const fetchExamById   = (id)       => api.get(`/exams/${id}`).then(r => r.data)
export const createExam      = (data)     => api.post('/exams', data).then(r => r.data)
export const updateExam      = (id, data) => api.put(`/exams/${id}`, data).then(r => r.data)
export const deleteExam      = (id)       => api.delete(`/exams/${id}`).then(r => r.data)