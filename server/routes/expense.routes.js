const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller')

router.get('/',       protect, authorizeRoles('admin'), getAllExpenses)
router.post('/',      protect, authorizeRoles('admin'), createExpense)
router.put('/:id',    protect, authorizeRoles('admin'), updateExpense)
router.delete('/:id', protect, authorizeRoles('admin'), deleteExpense)

module.exports = router