const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassSubjects,
} = require('../controllers/class.controller')

router.get('/',     protect, authorizeRoles('admin', 'teacher', 'student', 'parent'), getAllClasses)
router.get('/:id',  protect, authorizeRoles('admin', 'teacher'), getClassById)
router.post('/',    protect, authorizeRoles('admin'), createClass)
router.put('/:id',  protect, authorizeRoles('admin'), updateClass)
router.delete('/:id', protect, authorizeRoles('admin'), deleteClass)
router.get('/:id/subjects', protect, authorizeRoles('admin', 'teacher', 'student'), getClassSubjects)

module.exports = router