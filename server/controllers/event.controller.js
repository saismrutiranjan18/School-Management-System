const pool = require('../config/db')

const TYPE_COLORS = {
  holiday:  '#dc2626',
  exam:     '#7c3aed',
  ptm:      '#2563eb',
  sports:   '#16a34a',
  cultural: '#d97706',
  meeting:  '#0891b2',
  general:  '#64748b',
}

// GET /api/events?month=2025-02&role=all
const getEvents = async (req, res) => {
  const { month, from, to, event_type, class_id } = req.query
  const { role, id: userId } = req.user

  try {
    const params  = []
    let   idx     = 1
    let   filters = ''

    // Date range — if month provided use that, else use from/to
    if (month) {
      const [y, m]  = month.split('-')
      const start   = `${y}-${m}-01`
      const end     = new Date(y, m, 0).toISOString().split('T')[0]
      filters += ` AND e.event_date BETWEEN $${idx++} AND $${idx++}`
      params.push(start, end)
    } else if (from || to) {
      if (from) { filters += ` AND e.event_date >= $${idx++}`; params.push(from) }
      if (to)   { filters += ` AND e.event_date <= $${idx++}`; params.push(to)   }
    }

    if (event_type) {
      filters += ` AND e.event_type = $${idx++}`
      params.push(event_type)
    }

    if (class_id) {
      filters += ` AND (e.target_class = $${idx++} OR e.target_class IS NULL)`
      params.push(class_id)
    }

    // Role visibility filter
    let roleFilter = ''
    if (role !== 'admin') {
      roleFilter = ` AND (e.target_role = 'all' OR e.target_role = $${idx++})`
      params.push(role)
    }

    const result = await pool.query(`
      SELECT
        e.*,
        u.name       AS created_by_name,
        c.name       AS class_name,
        c.section    AS class_section,
        $${idx}::text AS color
      FROM events e
      LEFT JOIN users u   ON e.created_by   = u.id
      LEFT JOIN classes c ON e.target_class = c.id
      WHERE 1=1
        ${filters}
        ${roleFilter}
      ORDER BY e.event_date ASC, e.event_type
    `, [...params, TYPE_COLORS[req.query.event_type] || '#64748b'])

    // Add color per row based on event_type
    const enriched = result.rows.map(r => ({
      ...r,
      color: TYPE_COLORS[r.event_type] || '#64748b',
    }))

    res.json(enriched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch events.' })
  }
}

// GET /api/events/upcoming
// Next 5 upcoming events from today
const getUpcomingEvents = async (req, res) => {
  const { role } = req.user
  const today    = new Date().toISOString().split('T')[0]

  try {
    let roleFilter = ''
    const params   = [today]

    if (role !== 'admin') {
      roleFilter = ` AND (e.target_role = 'all' OR e.target_role = $2)`
      params.push(role)
    }

    // Merge real events + upcoming exams
    const events = await pool.query(`
      SELECT
        e.id, e.title, e.description,
        e.event_date, e.end_date,
        e.event_type, e.target_role,
        e.is_holiday,
        c.name    AS class_name,
        c.section AS class_section
      FROM events e
      LEFT JOIN classes c ON e.target_class = c.id
      WHERE e.event_date >= $1
        ${roleFilter}
      ORDER BY e.event_date ASC
      LIMIT 5
    `, params)

    res.json(events.rows.map(r => ({
      ...r,
      color: TYPE_COLORS[r.event_type] || '#64748b',
    })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming events.' })
  }
}

// POST /api/events
const createEvent = async (req, res) => {
  const {
    title, description, event_date, end_date,
    event_type, target_role, target_class, is_holiday,
  } = req.body

  if (!title || !event_date)
    return res.status(400).json({ error: 'title and event_date are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO events
        (title, description, event_date, end_date,
         event_type, target_role, target_class, is_holiday, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      title,
      description  || null,
      event_date,
      end_date     || null,
      event_type   || 'general',
      target_role  || 'all',
      target_class || null,
      is_holiday   || false,
      req.user.id,
    ])

    res.status(201).json({
      ...result.rows[0],
      color: TYPE_COLORS[result.rows[0].event_type] || '#64748b',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create event.' })
  }
}

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  const {
    title, description, event_date, end_date,
    event_type, target_role, target_class, is_holiday,
  } = req.body

  try {
    const result = await pool.query(`
      UPDATE events
      SET title=$1, description=$2, event_date=$3, end_date=$4,
          event_type=$5, target_role=$6, target_class=$7,
          is_holiday=$8, updated_at=NOW()
      WHERE id=$9
      RETURNING *
    `, [
      title, description || null, event_date, end_date || null,
      event_type || 'general', target_role || 'all',
      target_class || null, is_holiday || false,
      req.params.id,
    ])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Event not found.' })

    res.json({
      ...result.rows[0],
      color: TYPE_COLORS[result.rows[0].event_type] || '#64748b',
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event.' })
  }
}

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id=$1', [req.params.id])
    res.json({ message: 'Event deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event.' })
  }
}

module.exports = {
  getEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
}