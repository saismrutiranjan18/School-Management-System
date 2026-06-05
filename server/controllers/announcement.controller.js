const pool = require('../config/db')
const { sendAnnouncementEmail } = require('../utils/mailer')
const { getIO } = require('../socket')

// GET /api/announcements
// Returns announcements relevant to the logged-in user's role
const getAnnouncements = async (req, res) => {
  const { role, id: userId } = req.user
  const { class_id, limit = 50 } = req.query

  try {
    let classFilter = ''
    const params    = []
    let   idx       = 1

    if (role === 'admin') {
      // Admin sees everything
      classFilter = ''
    } else if (role === 'teacher') {
      // Teacher sees: all + teacher-targeted + their class
      classFilter = `
        AND (
          a.target_role = 'all'
          OR a.target_role = 'teacher'
          OR a.target_class IN (
            SELECT DISTINCT class_id FROM subjects
            WHERE teacher_id = (
              SELECT id FROM teachers WHERE user_id = $${idx++}
            )
          )
        )
      `
      params.push(userId)
    } else if (role === 'student') {
      // Student sees: all + student-targeted + their class
      classFilter = `
        AND (
          a.target_role = 'all'
          OR a.target_role = 'student'
          OR a.target_class = (
            SELECT class_id FROM students WHERE user_id = $${idx++}
          )
        )
      `
      params.push(userId)
    } else if (role === 'parent') {
      // Parent sees: all + parent-targeted + child's class
      classFilter = `
        AND (
          a.target_role = 'all'
          OR a.target_role = 'parent'
          OR a.target_class = (
            SELECT s.class_id FROM students s
            JOIN users pu ON pu.id = $${idx++}
            WHERE s.guardian_email = pu.email
            LIMIT 1
          )
        )
      `
      params.push(userId)
    }

    params.push(parseInt(limit))

    const result = await pool.query(`
      SELECT
        a.*,
        u.name       AS created_by_name,
        u.role       AS created_by_role,
        c.name       AS class_name,
        c.section    AS class_section
      FROM announcements a
      LEFT JOIN users u   ON a.created_by   = u.id
      LEFT JOIN classes c ON a.target_class = c.id
      WHERE a.is_active = TRUE
        ${classFilter}
      ORDER BY
        CASE a.priority
          WHEN 'urgent' THEN 1
          WHEN 'high'   THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low'    THEN 4
        END,
        a.created_at DESC
      LIMIT $${idx}
    `, params)

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch announcements.' })
  }
}

// POST /api/announcements
const createAnnouncement = async (req, res) => {
  const {
    title, body, target_role,
    target_class, priority, send_email,
  } = req.body

  if (!title || !body || !target_role)
    return res.status(400).json({ error: 'title, body and target_role are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO announcements
        (title, body, target_role, target_class, priority, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [
      title, body, target_role,
      target_class || null,
      priority     || 'normal',
      req.user.id,
    ])

    const announcement = result.rows[0]

    // Emit real-time notification to target audience
    try {
      const io = getIO()

      const notifPayload = {
        id:         announcement.id,
        type:       'announcement',
        title:      announcement.title,
        body:       announcement.body.slice(0, 100) + (announcement.body.length > 100 ? '...' : ''),
        priority:   announcement.priority,
        created_at: announcement.created_at,
        created_by: req.user.email,
      }

      if (announcement.target_role === 'all') {
        io.to('role:all').emit('notification', notifPayload)
      } else {
        io.to(`role:${announcement.target_role}`).emit('notification', notifPayload)
      }

      // Also emit to admin room always
      io.to('role:admin').emit('notification', notifPayload)
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr.message)
    }

    // Send email blast if requested (fire and forget)
    if (send_email) {
      sendEmailBlast(announcement, target_role, target_class || null)
        .catch(console.error)
    }

    res.status(201).json(announcement)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create announcement.' })
  }
}

// Helper: fetch recipient emails and send
const sendEmailBlast = async (announcement, target_role, target_class) => {
  try {
    let emailQuery = ''
    const params   = []

    if (target_role === 'all') {
      emailQuery = `SELECT DISTINCT email FROM users WHERE is_active = TRUE AND email IS NOT NULL`
    } else if (target_role === 'student') {
      if (target_class) {
        emailQuery = `
          SELECT u.email FROM users u
          JOIN students s ON s.user_id = u.id
          WHERE s.class_id = $1 AND u.is_active = TRUE
        `
        params.push(target_class)
      } else {
        emailQuery = `
          SELECT u.email FROM users u
          WHERE u.role = 'student' AND u.is_active = TRUE
        `
      }
    } else if (target_role === 'teacher') {
      emailQuery = `SELECT email FROM users WHERE role='teacher' AND is_active=TRUE`
    } else if (target_role === 'parent') {
      if (target_class) {
        emailQuery = `
          SELECT DISTINCT guardian_email AS email
          FROM students
          WHERE class_id = $1 AND guardian_email IS NOT NULL
        `
        params.push(target_class)
      } else {
        emailQuery = `
          SELECT DISTINCT guardian_email AS email
          FROM students WHERE guardian_email IS NOT NULL
        `
      }
    }

    if (!emailQuery) return

    const result     = await pool.query(emailQuery, params)
    const recipients = result.rows
      .map(r => r.email)
      .filter(Boolean)

    await sendAnnouncementEmail({
      recipients,
      title:    announcement.title,
      body:     announcement.body,
      priority: announcement.priority,
    })
  } catch (err) {
    console.error('Email blast error:', err.message)
  }
}

// PUT /api/announcements/:id
const updateAnnouncement = async (req, res) => {
  const { title, body, target_role, target_class, priority, is_active } = req.body
  try {
    const result = await pool.query(`
      UPDATE announcements
      SET title=$1, body=$2, target_role=$3, target_class=$4,
          priority=$5, is_active=$6, updated_at=NOW()
      WHERE id=$7
      RETURNING *
    `, [
      title, body, target_role,
      target_class || null,
      priority     || 'normal',
      is_active    ?? true,
      req.params.id,
    ])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Announcement not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement.' })
  }
}

// DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id])
    res.json({ message: 'Announcement deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' })
  }
}

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}