const express = require('express')
const router = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const pool = require('../config/db')
const upload = require('../middleware/upload.middleware')


// GET /api/students  (admin + teacher only)
router.get('/', protect, authorizeRoles('admin', 'teacher'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, u.name, u.email, u.is_active, s.roll_no, s.gender, s.guardian_name,
             s.guardian_phone, s.guardian_email, s.photo_url, s.admission_date,
             c.id AS class_id, c.name AS class_name, c.section
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.id DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students.' })
  }
})

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.name, u.email, u.role, u.is_active,
             c.name AS class_name, c.section
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [req.params.id])

    if (!result.rows[0]) return res.status(404).json({ error: 'Student not found.' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student.' })
  }
})

// POST /api/students  (admin only)
router.post('/', protect, authorizeRoles('admin'), async (req, res) => {
  const {
    name, email, password, roll_no, class_id,
    dob, gender, address, guardian_name,
    guardian_phone, guardian_email,
  } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const bcrypt = require('bcryptjs')
    const hash = await bcrypt.hash(password, 10)

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student') RETURNING id`,
      [name, email, hash]
    )

    const userId = userResult.rows[0].id

    const studentResult = await client.query(
      `INSERT INTO students
       (user_id, class_id, roll_no, dob, gender, address, guardian_name, guardian_phone, guardian_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, class_id, roll_no, dob, gender, address, guardian_name, guardian_phone, guardian_email]
    )

    await client.query('COMMIT')
    res.status(201).json(studentResult.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' })
    res.status(500).json({ error: 'Failed to create student.' })
  } finally {
    client.release()
  }
})

router.post('/:id/photo',
  protect,
  authorizeRoles('admin'),
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: 'No file uploaded.' })

      await pool.query(
        'UPDATE students SET photo_url=$1 WHERE id=$2',
        [req.file.path, req.params.id]
      )

      res.json({ photo_url: req.file.path })
    } catch (err) {
      res.status(500).json({ error: 'Failed to upload photo.' })
    }
  }
)

// PUT /api/students/:id  (admin only)
router.put('/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { roll_no, class_id, dob, gender, address, guardian_name, guardian_phone, guardian_email } = req.body
  try {
    const result = await pool.query(
      `UPDATE students SET roll_no=$1, class_id=$2, dob=$3, gender=$4,
       address=$5, guardian_name=$6, guardian_phone=$7, guardian_email=$8
       WHERE id=$9 RETURNING *`,
      [roll_no, class_id, dob, gender, address, guardian_name, guardian_phone, guardian_email || null, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Student not found.' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student.' })
  }
})

// PATCH /api/students/:id/status  (admin only)
// Replaces the old hard-delete. Deactivates (or reactivates) the student's
// login by flipping users.is_active — blocks access immediately while
// keeping attendance/marks/fees/library history intact and reversible.
// Body: { is_active: boolean }
router.patch('/:id/status', protect, authorizeRoles('admin'), async (req, res) => {
  const { is_active } = req.body
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active (boolean) is required.' })
  }

  try {
    const studentResult = await pool.query(
      'SELECT user_id FROM students WHERE id = $1', [req.params.id]
    )
    if (!studentResult.rows[0]) return res.status(404).json({ error: 'Student not found.' })

    await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [is_active, studentResult.rows[0].user_id]
    )

    res.json({
      message: is_active
        ? 'Student account reactivated.'
        : 'Student account deactivated — login access revoked, all records preserved.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update student status.' })
  }
})

module.exports = router