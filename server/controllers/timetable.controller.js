const pool = require('../config/db')

// GET /api/timetable/:classId
// Returns full week timetable for a class
const getTimetableByClass = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.day,
        t.period_no,
        t.start_time,
        t.end_time,
        s.id   AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        u.name AS teacher_name,
        tc.id  AS teacher_id
      FROM timetable t
      JOIN subjects s  ON t.subject_id = s.id
      JOIN teachers tc ON t.teacher_id = tc.id
      JOIN users u     ON tc.user_id   = u.id
      WHERE t.class_id = $1
      ORDER BY
        CASE t.day
          WHEN 'Monday'    THEN 1
          WHEN 'Tuesday'   THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday'  THEN 4
          WHEN 'Friday'    THEN 5
          WHEN 'Saturday'  THEN 6
        END,
        t.period_no
    `, [req.params.classId])

    // Also return period config
    const periods = await pool.query(
      'SELECT * FROM period_config ORDER BY period_no'
    )

    res.json({
      timetable: result.rows,
      periods: periods.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch timetable.' })
  }
}

// GET /api/timetable/teacher/:teacherId
// Returns a teacher's full week across all classes
const getTimetableByTeacher = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.day,
        t.period_no,
        t.start_time,
        t.end_time,
        s.name AS subject_name,
        s.code AS subject_code,
        c.name AS class_name,
        c.section
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes  c ON t.class_id   = c.id
      WHERE t.teacher_id = $1
      ORDER BY
        CASE t.day
          WHEN 'Monday'    THEN 1
          WHEN 'Tuesday'   THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday'  THEN 4
          WHEN 'Friday'    THEN 5
          WHEN 'Saturday'  THEN 6
        END,
        t.period_no
    `, [req.params.teacherId])

    const periods = await pool.query(
      'SELECT * FROM period_config ORDER BY period_no'
    )

    res.json({ timetable: result.rows, periods: periods.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher timetable.' })
  }
}

// POST /api/timetable
// Assign subject+teacher to a period slot
const assignPeriod = async (req, res) => {
  const { class_id, subject_id, teacher_id, day, period_no } = req.body

  if (!class_id || !subject_id || !teacher_id || !day || !period_no) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  try {
    // Get period times from config
    const periodConfig = await pool.query(
      'SELECT start_time, end_time FROM period_config WHERE period_no = $1',
      [period_no]
    )

    if (!periodConfig.rows[0]) {
      return res.status(400).json({ error: 'Invalid period number.' })
    }

    const { start_time, end_time } = periodConfig.rows[0]

    // Upsert — if slot exists update it, else insert
    const result = await pool.query(`
      INSERT INTO timetable
        (class_id, subject_id, teacher_id, day, period_no, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (class_id, day, period_no)
      DO UPDATE SET
        subject_id = EXCLUDED.subject_id,
        teacher_id = EXCLUDED.teacher_id,
        start_time = EXCLUDED.start_time,
        end_time   = EXCLUDED.end_time
      RETURNING *
    `, [class_id, subject_id, teacher_id, day, period_no, start_time, end_time])

    res.status(201).json(result.rows[0])
  } catch (err) {
    // Teacher double-booked at same day+period
    if (err.code === '23505' && err.constraint === 'unique_teacher_period') {
      return res.status(409).json({
        error: 'This teacher is already assigned to another class during this period.',
      })
    }
    console.error(err)
    res.status(500).json({ error: 'Failed to assign period.' })
  }
}

// DELETE /api/timetable/:id
const deletePeriod = async (req, res) => {
  try {
    await pool.query('DELETE FROM timetable WHERE id = $1', [req.params.id])
    res.json({ message: 'Period removed successfully.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete period.' })
  }
}

// DELETE /api/timetable/class/:classId
// Clear entire timetable for a class
const clearClassTimetable = async (req, res) => {
  try {
    await pool.query('DELETE FROM timetable WHERE class_id = $1', [req.params.classId])
    res.json({ message: 'Timetable cleared.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear timetable.' })
  }
}

module.exports = {
  getTimetableByClass,
  getTimetableByTeacher,
  assignPeriod,
  deletePeriod,
  clearClassTimetable,
}