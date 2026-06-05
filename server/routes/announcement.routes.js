const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcement.controller')

// All roles can view announcements relevant to them
router.get('/',     protect, getAnnouncements)

// Admin + teacher can create
router.post('/',    protect, authorizeRoles('admin','teacher'), createAnnouncement)

// Admin + teacher can edit (only own, unless admin)
router.put('/:id',  protect, authorizeRoles('admin','teacher'), updateAnnouncement)

// Admin only can delete
router.delete('/:id', protect, authorizeRoles('admin'), deleteAnnouncement)

module.exports = router