import api from './axios'

export const fetchTimetableByClass   = (classId)   => api.get(`/timetable/class/${classId}`).then(r => r.data)
export const fetchTimetableByTeacher = (teacherId) => api.get(`/timetable/teacher/${teacherId}`).then(r => r.data)
export const assignPeriod            = (data)      => api.post('/timetable', data).then(r => r.data)
export const deletePeriod            = (id)        => api.delete(`/timetable/${id}`).then(r => r.data)
export const clearClassTimetable     = (classId)   => api.delete(`/timetable/class/${classId}`).then(r => r.data)