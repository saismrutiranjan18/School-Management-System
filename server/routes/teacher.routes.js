const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const pool = require('../config/db')

// GET /api/teachers
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, u.name, u.email, t.qualification, t.joining_date, t.salary
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers.' })
  }
})

// POST /api/teachers  (admin only)
router.post('/', protect, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, qualification, joining_date, salary } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const bcrypt = require('bcryptjs')
    const hash = await bcrypt.hash(password, 10)

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'teacher') RETURNING id`,
      [name, email, hash]
    )

    const teacherResult = await client.query(
      `INSERT INTO teachers (user_id, qualification, joining_date, salary)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userResult.rows[0].id, qualification, joining_date, salary]
    )

    await client.query('COMMIT')
    res.status(201).json(teacherResult.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' })
    res.status(500).json({ error: 'Failed to create teacher.' })
  } finally {
    client.release()
  }
})

module.exports = router