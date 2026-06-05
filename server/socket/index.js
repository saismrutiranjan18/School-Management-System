const { Server }  = require('socket.io')
const jwt         = require('jsonwebtoken')

let io = null   // singleton — import this anywhere in the app

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  })

  // ── JWT Auth Middleware for Socket ─────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Authentication error: no token provided'))
    }

    try {
      const decoded  = jwt.verify(token, process.env.JWT_SECRET)
      socket.user    = decoded   // { id, email, role }
      next()
    } catch (err) {
      return next(new Error('Authentication error: invalid token'))
    }
  })

  // ── Connection Handler ──────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id, role, email } = socket.user

    console.log(`🔌 Socket connected: ${email} [${role}] — ${socket.id}`)

    // Each user joins:
    // 1. Their personal room  → "user:<id>"        (private alerts)
    // 2. Their role room      → "role:<role>"       (role broadcasts)
    // 3. The global room      → "role:all"          (school-wide)
    socket.join(`user:${id}`)
    socket.join(`role:${role}`)
    socket.join('role:all')

    // Confirm to client which rooms they're in
    socket.emit('connected', {
      message: `Connected as ${role}`,
      rooms:   [`user:${id}`, `role:${role}`, 'role:all'],
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${email} [${role}]`)
    })
  })

  return io
}

// Call this anywhere in controllers to emit events
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

module.exports = { initSocket, getIO }