const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = generateToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during login.' })
  }
}

// GET /api/auth/me  (protected)
// Returns base user info plus role-specific profile data, used by the
// shared Profile page for all four roles.
const getMe = async (req, res) => {
  const { id: userId, role } = req.user

  try {
    const userResult = await pool.query(
      `SELECT id, name, email, phone, photo_url, role, created_at
       FROM users WHERE id = $1`,
      [userId]
    )

    const user = userResult.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found.' })

    let profile = null

    if (role === 'teacher') {
      const teacherResult = await pool.query(
        `SELECT t.id, t.qualification, t.joining_date, t.salary
         FROM teachers t WHERE t.user_id = $1`,
        [userId]
      )
      const classesResult = await pool.query(
        `SELECT DISTINCT c.id, c.name, c.section
         FROM subjects sub
         JOIN classes c  ON sub.class_id = c.id
         JOIN teachers t ON sub.teacher_id = t.id
         WHERE t.user_id = $1
         ORDER BY c.name`,
        [userId]
      )
      profile = {
        ...teacherResult.rows[0],
        classes: classesResult.rows,
      }
    }

    if (role === 'student') {
      const studentResult = await pool.query(
        `SELECT s.id, s.roll_no, s.dob, s.gender, s.address,
                s.guardian_name, s.guardian_phone, s.guardian_email,
                s.admission_date, s.photo_url AS student_photo_url,
                c.name AS class_name, c.section
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = $1`,
        [userId]
      )
      profile = studentResult.rows[0] || null
    }

    if (role === 'parent') {
      const childResult = await pool.query(
        `SELECT s.id AS student_id, u.name AS student_name,
                c.name AS class_name, c.section
         FROM students s
         JOIN users u   ON s.user_id  = u.id
         JOIN users pu  ON pu.id      = $1
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.guardian_email = pu.email
         LIMIT 1`,
        [userId]
      )
      profile = { child: childResult.rows[0] || null }
    }

    res.json({ ...user, profile })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch profile.' })
  }
}

// PUT /api/auth/me  (protected)
// Self-service update — name, phone only. Email and role changes stay
// admin-only (via the existing per-role admin routes) to avoid breaking
// guardian_email matching for parents or login history.
const updateMe = async (req, res) => {
  const { id: userId } = req.user
  const { name, phone } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' })
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, phone = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, photo_url, role`,
      [name.trim(), phone || null, userId]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
}

// PUT /api/auth/me/password  (protected)
const changePassword = async (req, res) => {
  const { id: userId } = req.user
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required.' })
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])
    const user = result.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const isMatch = await bcrypt.compare(current_password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }

    const newHash = await bcrypt.hash(new_password, 10)
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    )

    res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to change password.' })
  }
}

// POST /api/auth/me/photo  (protected) — uses existing Cloudinary upload middleware
const updateMyPhoto = async (req, res) => {
  const { id: userId } = req.user
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' })
    }

    await pool.query('UPDATE users SET photo_url = $1 WHERE id = $2', [req.file.path, userId])

    res.json({ photo_url: req.file.path })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to upload photo.' })
  }
}

// POST /api/auth/logout  (client just deletes token, but we handle it here)
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully.' })
}

module.exports = { login, getMe, updateMe, changePassword, updateMyPhoto, logout }