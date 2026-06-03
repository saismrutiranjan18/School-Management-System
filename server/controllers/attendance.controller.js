const pool = require('../config/db')
const { sendAbsenceAlert } = require('../utils/mailer')

// POST /api/attendance
// Mark attendance for an entire class for one subject on one date
// Body: { class_id, subject_id, teacher_id, date, records: [{student_id, status, remarks}] }
const markAttendance = async (req, res) => {
  const { class_id, subject_id, teacher_id, date, records } = req.body

  if (!class_id || !subject_id || !teacher_id || !date || !records?.length) {
    return res.status(400).json({ error: 'All fields and at least one record are required.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const results = []

    for (const record of records) {
      const { student_id, status, remarks } = record

      // Upsert attendance record
      const result = await client.query(`
        INSERT INTO attendance
          (student_id, class_id, subject_id, teacher_id, date, status, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (student_id, subject_id, date)
        DO UPDATE SET
          status     = EXCLUDED.status,
          remarks    = EXCLUDED.remarks,
          teacher_id = EXCLUDED.teacher_id
        RETURNING *
      `, [student_id, class_id, subject_id, teacher_id, date, status, remarks || null])

      results.push(result.rows[0])

      // Send email alert if absent
      if (status === 'absent') {
        // Fetch student + guardian info
        const studentInfo = await client.query(`
          SELECT
            u.name       AS student_name,
            s.guardian_name,
            s.guardian_email,
            sub.name     AS subject_name
          FROM students s
          JOIN users u    ON s.user_id    = u.id
          JOIN subjects sub ON sub.id     = $2
          WHERE s.id = $1
        `, [student_id, subject_id])

        const info = studentInfo.rows[0]
        if (info) {
          // Fire and forget — don't await, don't block the response
          sendAbsenceAlert({
            parentEmail:  info.guardian_email,
            parentName:   info.guardian_name,
            studentName:  info.student_name,
            subjectName:  info.subject_name,
            date,
          }).catch(console.error)
        }
      }
    }

    await client.query('COMMIT')
    res.status(201).json({
      message: `Attendance marked for ${results.length} students.`,
      records: results,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to mark attendance.' })
  } finally {
    client.release()
  }
}

// GET /api/attendance/:classId/:subjectId/:date
// Get attendance records for a class+subject on a specific date
// Used by teacher to see/edit today's attendance
const getAttendanceByClassSubjectDate = async (req, res) => {
  const { classId, subjectId, date } = req.params
  try {
    // Get all students in class
    const students = await pool.query(`
      SELECT s.id AS student_id, u.name, s.roll_no
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.class_id = $1
      ORDER BY s.roll_no, u.name
    `, [classId])

    // Get existing attendance records for this date
    const existing = await pool.query(`
      SELECT student_id, status, remarks
      FROM attendance
      WHERE class_id = $1 AND subject_id = $2 AND date = $3
    `, [classId, subjectId, date])

    // Map existing records by student_id for fast lookup
    const existingMap = {}
    existing.rows.forEach(r => { existingMap[r.student_id] = r })

    // Merge: every student gets a status (default 'present' if not yet marked)
    const merged = students.rows.map(s => ({
      student_id: s.student_id,
      name:       s.name,
      roll_no:    s.roll_no,
      status:     existingMap[s.student_id]?.status  || 'present',
      remarks:    existingMap[s.student_id]?.remarks  || '',
      marked:     !!existingMap[s.student_id],
    }))

    res.json({
      date,
      class_id:   classId,
      subject_id: subjectId,
      students:   merged,
      is_marked:  existing.rows.length > 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch attendance.' })
  }
}

// GET /api/attendance/student/:studentId
// Full attendance history for a student — grouped by subject with %
const getStudentAttendance = async (req, res) => {
  const { studentId } = req.params
  const { from, to } = req.query // optional date range

  try {
    // Overall subject-wise summary
    const summary = await pool.query(`
      SELECT
        sub.id         AS subject_id,
        sub.name       AS subject_name,
        sub.code       AS subject_code,
        COUNT(*)                                           AS total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent'  THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN a.status = 'late'    THEN 1 ELSE 0 END) AS late_count,
        ROUND(
          SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END)
          * 100.0 / NULLIF(COUNT(*), 0), 1
        ) AS attendance_percentage
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = $1
        ${from ? 'AND a.date >= $2' : ''}
        ${to   ? `AND a.date <= $${from ? 3 : 2}` : ''}
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY sub.name
    `, from && to ? [studentId, from, to] : from ? [studentId, from] : [studentId])

    // Detailed day-by-day records
    const details = await pool.query(`
      SELECT
        a.date,
        a.status,
        a.remarks,
        sub.name AS subject_name,
        sub.code AS subject_code
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = $1
      ORDER BY a.date DESC, sub.name
      LIMIT 100
    `, [studentId])

    res.json({
      summary:  summary.rows,
      details:  details.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch student attendance.' })
  }
}

// GET /api/attendance/report/:classId
// Class-wide attendance report — all students, all subjects, with %
const getClassAttendanceReport = async (req, res) => {
  const { classId } = req.params
  const { from, to, subject_id } = req.query

  try {
    const params = [classId]
    let paramIndex = 2
    let extraFilters = ''

    if (subject_id) {
      extraFilters += ` AND a.subject_id = $${paramIndex++}`
      params.push(subject_id)
    }
    if (from) {
      extraFilters += ` AND a.date >= $${paramIndex++}`
      params.push(from)
    }
    if (to) {
      extraFilters += ` AND a.date <= $${paramIndex++}`
      params.push(to)
    }

    const result = await pool.query(`
      SELECT
        u.name         AS student_name,
        s.roll_no,
        sub.name       AS subject_name,
        sub.code       AS subject_code,
        COUNT(*)       AS total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent'  THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'late'    THEN 1 ELSE 0 END) AS late,
        ROUND(
          SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END)
          * 100.0 / NULLIF(COUNT(*), 0), 1
        ) AS percentage
      FROM attendance a
      JOIN students s  ON a.student_id  = s.id
      JOIN users u     ON s.user_id     = u.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.class_id = $1 ${extraFilters}
      GROUP BY u.name, s.roll_no, sub.name, sub.code
      ORDER BY s.roll_no, sub.name
    `, params)

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate report.' })
  }
}

module.exports = {
  markAttendance,
  getAttendanceByClassSubjectDate,
  getStudentAttendance,
  getClassAttendanceReport,
}