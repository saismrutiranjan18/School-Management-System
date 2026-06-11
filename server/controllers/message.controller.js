const pool       = require('../config/db')
const { getIO }  = require('../socket')

// ── GET /api/messages/conversations ──────────────────────────────────
const getConversations = async (req, res) => {
  const userId = req.user.id

  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (other_user_id)
        other_user_id,
        other_user_name,
        other_user_role,
        last_message,
        last_message_at,
        last_sender_id,
        unread_count
      FROM (
        SELECT
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END                                   AS other_user_id,
          u.name                                AS other_user_name,
          u.role                                AS other_user_role,
          m.content                             AS last_message,
          m.sent_at                             AS last_message_at,
          m.sender_id                           AS last_sender_id,
          (
            SELECT COUNT(*)
            FROM messages unread
            WHERE unread.sender_id = CASE
                WHEN m.sender_id = $1 THEN m.receiver_id
                ELSE m.sender_id
              END
              AND unread.receiver_id = $1
              AND unread.read_at IS NULL
          )                                     AS unread_count
        FROM messages m
        JOIN users u ON u.id = CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.sent_at DESC
      ) sub
      ORDER BY other_user_id, last_message_at DESC
    `, [userId])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch conversations.' })
  }
}

// ── GET /api/messages/conversation/:otherUserId ───────────────────────
const getThread = async (req, res) => {
  const myId    = req.user.id
  const otherId = parseInt(req.params.otherUserId)
  const { page = 1, limit = 50 } = req.query
  const offset  = (page - 1) * limit

  try {
    const otherUser = await pool.query(
      'SELECT id, name, role FROM users WHERE id = $1',
      [otherId]
    )
    if (!otherUser.rows[0])
      return res.status(404).json({ error: 'User not found.' })

    const result = await pool.query(`
      SELECT
        m.*,
        u.name AS sender_name,
        u.role AS sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE
        (m.sender_id = $1 AND m.receiver_id = $2)
        OR
        (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.sent_at ASC
      LIMIT $3 OFFSET $4
    `, [myId, otherId, limit, offset])

    // Mark unread as read
    await pool.query(`
      UPDATE messages
      SET read_at = NOW()
      WHERE sender_id = $1
        AND receiver_id = $2
        AND read_at IS NULL
    `, [otherId, myId])

    res.json({
      other_user: otherUser.rows[0],
      messages:   result.rows,
      page:       parseInt(page),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch thread.' })
  }
}

// ── POST /api/messages ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  const senderId = req.user.id
  const { receiver_id, content } = req.body

  if (!receiver_id || !content?.trim())
    return res.status(400).json({ error: 'receiver_id and content are required.' })

  if (parseInt(receiver_id) === senderId)
    return res.status(400).json({ error: 'Cannot send message to yourself.' })

  try {
    const receiverResult = await pool.query(
      'SELECT id, name, role FROM users WHERE id = $1 AND is_active = TRUE',
      [receiver_id]
    )
    if (!receiverResult.rows[0])
      return res.status(404).json({ error: 'Receiver not found.' })

    const receiver = receiverResult.rows[0]

    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [senderId, receiver_id, content.trim()])

    const message = result.rows[0]

    const senderResult = await pool.query(
      'SELECT id, name, role FROM users WHERE id = $1',
      [senderId]
    )

    const enriched = {
      ...message,
      sender_name: senderResult.rows[0].name,
      sender_role: senderResult.rows[0].role,
    }

    try {
      const io = getIO()
      io.to(`user:${receiver_id}`).emit('new_message', enriched)
      io.to(`user:${receiver_id}`).emit('notification', {
        type:       'message',
        title:      `New message from ${senderResult.rows[0].name}`,
        body:       content.trim().slice(0, 80) + (content.length > 80 ? '...' : ''),
        priority:   'normal',
        created_at: message.sent_at,
        sender_id:  senderId,
      })
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr.message)
    }

    res.status(201).json(enriched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send message.' })
  }
}

// ── GET /api/messages/contacts ────────────────────────────────────────
const getContacts = async (req, res) => {
  const { id: userId, role } = req.user

  try {
    let result

    if (role === 'admin') {
      result = await pool.query(`
        SELECT id, name, role FROM users
        WHERE id <> $1 AND is_active = TRUE
        ORDER BY role, name
      `, [userId])

    } else if (role === 'teacher') {
      result = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.role
        FROM users u
        WHERE u.role = 'admin' AND u.is_active = TRUE
        UNION
        SELECT DISTINCT pu.id, pu.name, pu.role
        FROM users pu
        JOIN students s   ON s.guardian_email = pu.email
        JOIN subjects sub ON sub.class_id = s.class_id
        JOIN teachers t   ON sub.teacher_id = t.id
        WHERE t.user_id = $1
          AND pu.is_active = TRUE
          AND pu.id <> $1
        ORDER BY role, name
      `, [userId])

    } else if (role === 'parent') {
      result = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.role
        FROM users u
        WHERE u.role = 'admin' AND u.is_active = TRUE
        UNION
        SELECT DISTINCT tu.id, tu.name, tu.role
        FROM users tu
        JOIN teachers t   ON t.user_id = tu.id
        JOIN subjects sub ON sub.teacher_id = t.id
        JOIN students s   ON sub.class_id = s.class_id
        JOIN users pu     ON pu.id = $1
        WHERE pu.email = s.guardian_email
          AND tu.is_active = TRUE
          AND tu.id <> $1
        ORDER BY role, name
      `, [userId])

    } else if (role === 'student') {
      result = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.role
        FROM users u
        WHERE u.role = 'admin' AND u.is_active = TRUE
        UNION
        SELECT DISTINCT tu.id, tu.name, tu.role
        FROM users tu
        JOIN teachers t   ON t.user_id = tu.id
        JOIN subjects sub ON sub.teacher_id = t.id
        JOIN students s   ON sub.class_id = s.class_id
        WHERE s.user_id = $1
          AND tu.is_active = TRUE
          AND tu.id <> $1
        ORDER BY role, name
      `, [userId])
    }

    res.json(result?.rows || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch contacts.' })
  }
}

// ── GET /api/messages/unread-count ───────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS unread
      FROM messages
      WHERE receiver_id = $1 AND read_at IS NULL
    `, [req.user.id])

    res.json({ unread: parseInt(result.rows[0].unread) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count.' })
  }
}

module.exports = {
  getConversations,
  getThread,
  sendMessage,
  getContacts,
  getUnreadCount,
}