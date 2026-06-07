const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/event.controller')

// All roles can view
router.get('/',          protect, getEvents)
router.get('/upcoming',  protect, getUpcomingEvents)

// Admin + teacher can create/edit
router.post('/',         protect, authorizeRoles('admin','teacher'), createEvent)
router.put('/:id',       protect, authorizeRoles('admin','teacher'), updateEvent)

// Admin only can delete
router.delete('/:id',    protect, authorizeRoles('admin'), deleteEvent)

module.exports = router