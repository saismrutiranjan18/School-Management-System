const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/auth.middleware')
const {
  getConversations,
  getThread,
  sendMessage,
  getContacts,
  getUnreadCount,
} = require('../controllers/message.controller')

router.get('/conversations',           protect, getConversations)
router.get('/contacts',                protect, getContacts)
router.get('/unread-count',            protect, getUnreadCount)
router.get('/conversation/:otherUserId', protect, getThread)
router.post('/',                       protect, sendMessage)

module.exports = router