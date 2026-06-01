const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getTimetableByClass,
  getTimetableByTeacher,
  assignPeriod,
  deletePeriod,
  clearClassTimetable,
} = require('../controllers/timetable.controller')

// Class timetable — all roles can view
router.get('/class/:classId',
  protect,
  getTimetableByClass
)

// Teacher's own timetable
router.get('/teacher/:teacherId',
  protect,
  getTimetableByTeacher
)

// Assign a period — admin only
router.post('/',
  protect,
  authorizeRoles('admin'),
  assignPeriod
)

// Remove a period — admin only
router.delete('/:id',
  protect,
  authorizeRoles('admin'),
  deletePeriod
)

// Clear full timetable for a class — admin only
router.delete('/class/:classId',
  protect,
  authorizeRoles('admin'),
  clearClassTimetable
)

module.exports = router