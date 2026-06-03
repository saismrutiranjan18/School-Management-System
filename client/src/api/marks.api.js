import api from './axios'

export const enterMarks       = (data)              => api.post('/marks', data).then(r => r.data)
export const fetchMarksSheet  = (examId, subjectId) => api.get(`/marks/sheet/${examId}/${subjectId}`).then(r => r.data)
export const fetchStudentMarks = (studentId, exam_id) =>
  api.get(`/marks/student/${studentId}`, { params: { exam_id } }).then(r => r.data)
export const fetchReportCard  = (studentId, examId) =>
  api.get(`/marks/report-card/${studentId}/${examId}`).then(r => r.data)
export const downloadReportCardPDF = (studentId, examId) =>
  api.get(`/marks/report-card/${studentId}/${examId}/pdf`, { responseType: 'blob' })