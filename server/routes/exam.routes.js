const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllExams, getExamById, createExam, updateExam, deleteExam,
} = require('../controllers/exam.controller')

router.get('/',     protect, getAllExams)
router.get('/:id',  protect, getExamById)
router.post('/',    protect, authorizeRoles('admin'), createExam)
router.put('/:id',  protect, authorizeRoles('admin'), updateExam)
router.delete('/:id', protect, authorizeRoles('admin'), deleteExam)

module.exports = router