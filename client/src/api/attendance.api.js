import api from './axios'

export const markAttendance = (data) =>
  api.post('/attendance', data).then(r => r.data)

export const fetchAttendanceSheet = (classId, subjectId, date) =>
  api.get(`/attendance/${classId}/${subjectId}/${date}`).then(r => r.data)

export const fetchStudentAttendance = (studentId, params = {}) =>
  api.get(`/attendance/student/${studentId}`, { params }).then(r => r.data)

export const fetchClassAttendanceReport = (classId, params = {}) =>
  api.get(`/attendance/report/${classId}`, { params }).then(r => r.data)