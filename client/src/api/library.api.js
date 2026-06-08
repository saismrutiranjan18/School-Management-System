import api from './axios'

export const fetchBooks          = (params = {}) =>
  api.get('/library/books', { params }).then(r => r.data)

export const addBook             = (data)        =>
  api.post('/library/books', data).then(r => r.data)

export const updateBook          = (id, data)    =>
  api.put(`/library/books/${id}`, data).then(r => r.data)

export const deleteBook          = (id)          =>
  api.delete(`/library/books/${id}`).then(r => r.data)

export const issueBook           = (data)        =>
  api.post('/library/issue', data).then(r => r.data)

export const returnBook          = (issueId, data) =>
  api.post(`/library/return/${issueId}`, data).then(r => r.data)

export const fetchIssuedBooks    = ()            =>
  api.get('/library/issued').then(r => r.data)

export const fetchOverdueBooks   = ()            =>
  api.get('/library/overdue').then(r => r.data)

export const fetchStudentHistory = (studentId)   =>
  api.get(`/library/student/${studentId}`).then(r => r.data)