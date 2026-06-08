const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssuedBooks,
  getOverdueBooks,
  getStudentHistory,
} = require('../controllers/library.controller')

// Books catalog — all roles can view
router.get('/books',        protect, getAllBooks)
router.post('/books',       protect, authorizeRoles('admin'), addBook)
router.put('/books/:id',    protect, authorizeRoles('admin'), updateBook)
router.delete('/books/:id', protect, authorizeRoles('admin'), deleteBook)

// Issue / Return — admin only
router.post('/issue',           protect, authorizeRoles('admin'), issueBook)
router.post('/return/:issueId', protect, authorizeRoles('admin'), returnBook)

// Reports
router.get('/issued',             protect, authorizeRoles('admin'), getIssuedBooks)
router.get('/overdue',            protect, authorizeRoles('admin'), getOverdueBooks)
router.get('/student/:studentId', protect, getStudentHistory)

module.exports = router