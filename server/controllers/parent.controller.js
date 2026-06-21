const pool = require('../config/db')
const bcrypt = require('bcryptjs')

// GET /api/parents
// Lists all parent accounts, with whichever student's guardian_email
// currently matches their login email (the existing linkage mechanism
// used throughout the app — see getParentDashboard in analytics.controller.js)
const getAllParents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
        s.id        AS student_id,
        su.name     AS student_name,
        c.name      AS class_name,
        c.section
      FROM users u
      LEFT JOIN students s ON s.guardian_email = u.email
      LEFT JOIN users su   ON s.user_id = su.id
      LEFT JOIN classes c  ON s.class_id = c.id
      WHERE u.role = 'parent'
      ORDER BY u.id DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch parents.' })
  }
}

// GET /api/parents/:id
const getParentById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at
      FROM users u WHERE u.id = $1 AND u.role = 'parent'
    `, [req.params.id])

    if (!result.rows[0]) return res.status(404).json({ error: 'Parent not found.' })

    const childResult = await pool.query(`
      SELECT s.id AS student_id, su.name AS student_name,
             c.name AS class_name, c.section
      FROM students s
      JOIN users su ON s.user_id = su.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.guardian_email = $1
    `, [result.rows[0].email])

    res.json({ ...result.rows[0], children: childResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parent.' })
  }
}

// POST /api/parents
// Creates a parent login. If `email` matches an existing student's
// guardian_email, the dashboard/messaging/notice-board linkage activates
// immediately — no extra step needed.
const createParent = async (req, res) => {
  const { name, email, password, phone } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required.' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, 'parent', $4)
       RETURNING id, name, email, phone, is_active, created_at`,
      [name, email, hash, phone || null]
    )

    const linkCheck = await pool.query(
      `SELECT su.name AS student_name FROM students s
       JOIN users su ON s.user_id = su.id
       WHERE s.guardian_email = $1 LIMIT 1`,
      [email]
    )

    res.status(201).json({
      parent: result.rows[0],
      linked_student: linkCheck.rows[0]?.student_name || null,
    })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' })
    console.error(err)
    res.status(500).json({ error: 'Failed to create parent account.' })
  }
}

// PUT /api/parents/:id
// Updating the parent's email re-points guardian_email on any student
// record that was matched to their old email, so the linkage never
// silently breaks.
const updateParent = async (req, res) => {
  const { name, email, phone } = req.body
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existing = await client.query(
      `SELECT email FROM users WHERE id = $1 AND role = 'parent'`,
      [req.params.id]
    )
    if (!existing.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Parent not found.' })
    }

    const oldEmail = existing.rows[0].email

    const result = await client.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, is_active, created_at`,
      [name, email, phone || null, req.params.id]
    )

    if (email && email !== oldEmail) {
      await client.query(
        `UPDATE students SET guardian_email = $1 WHERE guardian_email = $2`,
        [email, oldEmail]
      )
    }

    await client.query('COMMIT')
    res.json(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' })
    console.error(err)
    res.status(500).json({ error: 'Failed to update parent.' })
  } finally {
    client.release()
  }
}

// PATCH /api/parents/:id/status
// Deactivates (or reactivates) a parent's login. Preferred over deleting —
// keeps message history intact and the guardian_email link on the student
// record untouched (so it can be reactivated or reassigned later without
// re-entering anything).
// Body: { is_active: boolean }
const setParentStatus = async (req, res) => {
  const { is_active } = req.body
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active (boolean) is required.' })
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'parent'
       RETURNING id`,
      [is_active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Parent not found.' })

    res.json({
      message: is_active
        ? 'Parent account reactivated.'
        : 'Parent account deactivated — login access revoked, message history preserved.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update parent status.' })
  }
}

module.exports = {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  setParentStatus,
}