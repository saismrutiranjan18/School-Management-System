const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  setParentStatus,
} = require('../controllers/parent.controller')

router.get('/',           protect, authorizeRoles('admin'), getAllParents)
router.get('/:id',        protect, authorizeRoles('admin'), getParentById)
router.post('/',          protect, authorizeRoles('admin'), createParent)
router.put('/:id',        protect, authorizeRoles('admin'), updateParent)
router.patch('/:id/status', protect, authorizeRoles('admin'), setParentStatus)

module.exports = router