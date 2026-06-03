const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  enterMarks,
  getMarksSheet,
  getStudentMarks,
  getReportCard,
  downloadReportCard,
} = require('../controllers/marks.controller')

// Enter marks — teacher + admin
router.post('/',
  protect, authorizeRoles('admin','teacher'), enterMarks)

// Marks sheet for entry — teacher + admin
router.get('/sheet/:examId/:subjectId',
  protect, authorizeRoles('admin','teacher'), getMarksSheet)

// Student's marks — all roles
router.get('/student/:studentId',
  protect, getStudentMarks)

// Report card JSON — all roles
router.get('/report-card/:studentId/:examId',
  protect, getReportCard)

// Report card PDF download — all roles
router.get('/report-card/:studentId/:examId/pdf',
  protect, downloadReportCard)

module.exports = router