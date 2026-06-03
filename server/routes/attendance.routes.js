const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  markAttendance,
  getAttendanceByClassSubjectDate,
  getStudentAttendance,
  getClassAttendanceReport,
} = require('../controllers/attendance.controller')

// Mark attendance — teacher + admin
router.post('/',
  protect,
  authorizeRoles('admin', 'teacher'),
  markAttendance
)

// Get attendance for marking — teacher + admin
router.get('/:classId/:subjectId/:date',
  protect,
  authorizeRoles('admin', 'teacher'),
  getAttendanceByClassSubjectDate
)

// Student's own attendance — student + parent + teacher + admin
router.get('/student/:studentId',
  protect,
  getStudentAttendance
)

// Class attendance report — teacher + admin
router.get('/report/:classId',
  protect,
  authorizeRoles('admin', 'teacher'),
  getClassAttendanceReport
)

module.exports = router