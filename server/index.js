const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const studentRoutes = require('./routes/student.routes')
const teacherRoutes = require('./routes/teacher.routes')
const classRoutes = require('./routes/class.routes')
const subjectRoutes = require('./routes/subject.routes')
const timetableRoutes = require('./routes/timetable.routes')
const attendanceRoutes = require('./routes/attendance.routes')
const examRoutes  = require('./routes/exam.routes')
const marksRoutes = require('./routes/marks.routes')
const feesRoutes = require('./routes/fees.routes')
const expenseRoutes = require('./routes/expense.routes')
const announcementRoutes = require('./routes/announcement.routes')
const http           = require('http')
const { initSocket } = require('./socket')
const messageRoutes = require('./routes/message.routes')
const eventRoutes = require('./routes/event.routes')
const libraryRoutes = require('./routes/library.routes')
const transportRoutes = require('./routes/transport.routes')
const analyticsRoutes = require('./routes/analytics.routes')



const app = express()

// Middleware
app.use(helmet())

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,       // set this on Render
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/timetable', timetableRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/marks', marksRoutes)
app.use('/api/fees', feesRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/transport', transportRoutes)
app.use('/api/analytics', analyticsRoutes)



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SMS API is running' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

const PORT = process.env.PORT || 5000
const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔌 Socket.io ready`)
})