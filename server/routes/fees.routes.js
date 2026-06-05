const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllFeeStructures,
  getFeeStructureByClass,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} = require('../controllers/feeStructure.controller')
const {
  recordPayment,
  getStudentFeeStatus,
  getCollectionSummary,
  getOutstandingDues,
} = require('../controllers/feeCollection.controller')
const {
  downloadReceipt,
  downloadInvoice,
} = require('../controllers/receiptInvoice.controller')

// ── Fee Structure ────────────────────────────────────────────────────
router.get('/structure',
  protect, authorizeRoles('admin'), getAllFeeStructures)

router.get('/structure/class/:classId',
  protect, authorizeRoles('admin','teacher'), getFeeStructureByClass)

router.post('/structure',
  protect, authorizeRoles('admin'), createFeeStructure)

router.put('/structure/:id',
  protect, authorizeRoles('admin'), updateFeeStructure)

router.delete('/structure/:id',
  protect, authorizeRoles('admin'), deleteFeeStructure)

// ── Fee Collection ───────────────────────────────────────────────────
router.post('/pay',
  protect, authorizeRoles('admin'), recordPayment)

router.get('/student/:studentId',
  protect, getStudentFeeStatus)

router.get('/collection',
  protect, authorizeRoles('admin'), getCollectionSummary)

router.get('/outstanding',
  protect, authorizeRoles('admin'), getOutstandingDues)

router.get('/receipt/:receiptNo',
  protect,
  downloadReceipt
)

router.get('/invoice/:studentId',
  protect,
  downloadInvoice
)

module.exports = router