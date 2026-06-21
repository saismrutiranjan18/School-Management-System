const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const pool = require('../config/db')

// GET /api/teachers
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, u.id AS user_id, u.name, u.email, u.is_active,
             t.qualification, t.joining_date, t.salary
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers.' })
  }
})

// GET /api/teachers/:id
router.get('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, u.id AS user_id, u.name, u.email, u.is_active,
             t.qualification, t.joining_date, t.salary
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [req.params.id])

    if (!result.rows[0]) return res.status(404).json({ error: 'Teacher not found.' })

    const classesResult = await pool.query(`
      SELECT DISTINCT c.id, c.name, c.section
      FROM subjects sub
      JOIN classes c ON sub.class_id = c.id
      WHERE sub.teacher_id = $1
      ORDER BY c.name
    `, [req.params.id])

    res.json({ ...result.rows[0], classes: classesResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher.' })
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

// PUT /api/teachers/:id  (admin only)
// Updates both the users row (name) and teachers row (qualification/joining_date/salary)
router.put('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { name, qualification, joining_date, salary } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const teacherResult = await client.query(
      'SELECT user_id FROM teachers WHERE id = $1', [req.params.id]
    )
    if (!teacherResult.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Teacher not found.' })
    }

    if (name) {
      await client.query(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, teacherResult.rows[0].user_id]
      )
    }

    const updated = await client.query(
      `UPDATE teachers
       SET qualification = $1, joining_date = $2, salary = $3
       WHERE id = $4
       RETURNING *`,
      [qualification || null, joining_date || null, salary || null, req.params.id]
    )

    await client.query('COMMIT')
    res.json(updated.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to update teacher.' })
  } finally {
    client.release()
  }
})

// PATCH /api/teachers/:id/status  (admin only)
// Deactivates (or reactivates) a teacher's login by flipping users.is_active.
// Preferred over deleting — keeps all attendance/marks/timetable history
// they're attached to intact, and is fully reversible.
// Body: { is_active: boolean }
router.patch('/:id/status', protect, authorizeRoles('admin'), async (req, res) => {
  const { is_active } = req.body
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active (boolean) is required.' })
  }

  try {
    const teacherResult = await pool.query(
      'SELECT user_id FROM teachers WHERE id = $1', [req.params.id]
    )
    if (!teacherResult.rows[0]) return res.status(404).json({ error: 'Teacher not found.' })

    await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [is_active, teacherResult.rows[0].user_id]
    )

    res.json({
      message: is_active
        ? 'Teacher account reactivated.'
        : 'Teacher account deactivated — login access revoked, all records preserved.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update teacher status.' })
  }
})

module.exports = router