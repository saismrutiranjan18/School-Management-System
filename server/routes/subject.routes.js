const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subject.controller')

router.get('/',       protect, authorizeRoles('admin', 'teacher'), getAllSubjects)
router.get('/:id',    protect, authorizeRoles('admin', 'teacher'), getSubjectById)
router.post('/',      protect, authorizeRoles('admin'), createSubject)
router.put('/:id',    protect, authorizeRoles('admin'), updateSubject)
router.delete('/:id', protect, authorizeRoles('admin'), deleteSubject)

module.exports = router