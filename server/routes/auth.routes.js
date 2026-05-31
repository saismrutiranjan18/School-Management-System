const express = require('express')
const router = express.Router()
const { login, getMe, logout } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')

router.post('/login', login)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

module.exports = router