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

const app = express()

// Middleware
app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})