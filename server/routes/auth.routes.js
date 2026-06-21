const express = require('express')
const router = express.Router()
const { login, getMe, updateMe, changePassword, updateMyPhoto, logout } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.post('/login', login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.put('/me', protect, updateMe)
router.put('/me/password', protect, changePassword)
router.post('/me/photo', protect, upload.single('photo'), updateMyPhoto)

module.exports = router