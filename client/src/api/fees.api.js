import api from './axios'

// Fee Structure
export const fetchFeeStructures     = (params = {}) => api.get('/fees/structure', { params }).then(r => r.data)
export const fetchFeeStructureClass = (classId)     => api.get(`/fees/structure/class/${classId}`).then(r => r.data)
export const createFeeStructure     = (data)        => api.post('/fees/structure', data).then(r => r.data)
export const updateFeeStructure     = (id, data)    => api.put(`/fees/structure/${id}`, data).then(r => r.data)
export const deleteFeeStructure     = (id)          => api.delete(`/fees/structure/${id}`).then(r => r.data)

// Fee Collection
export const recordPayment          = (data)        => api.post('/fees/pay', data).then(r => r.data)
export const fetchStudentFeeStatus  = (studentId, params = {}) =>
  api.get(`/fees/student/${studentId}`, { params }).then(r => r.data)
export const fetchCollectionSummary = (params = {}) => api.get('/fees/collection', { params }).then(r => r.data)
export const fetchOutstandingDues   = (params = {}) => api.get('/fees/outstanding', { params }).then(r => r.data)

export const downloadReceipt = (receiptNo) =>
  api.get(`/fees/receipt/${receiptNo}`, { responseType: 'blob' })

export const downloadInvoice = (studentId, params = {}) =>
  api.get(`/fees/invoice/${studentId}`, { responseType: 'blob', params })

export const fetchFinancialReport = (params = {}) =>
  api.get('/fees/report/financial', { params }).then(r => r.data)

export const downloadFinancialReportPDF = (params = {}) =>
  api.get('/fees/report/financial/pdf', { responseType: 'blob', params })