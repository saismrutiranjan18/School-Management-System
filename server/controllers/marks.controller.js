const pool = require('../config/db')
const { calculateResult } = require('../utils/grading')
const { generateReportCardPDF } = require('../utils/reportCard')

// POST /api/marks
// Bulk marks entry for one subject in one exam
// Body: { exam_id, subject_id, records: [{student_id, marks_obtained, max_marks, is_absent, remarks}] }
const enterMarks = async (req, res) => {
  const { exam_id, subject_id, records } = req.body

  if (!exam_id || !subject_id || !records?.length)
    return res.status(400).json({ error: 'exam_id, subject_id, and records are required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const results = []

    for (const rec of records) {
      const { student_id, marks_obtained, max_marks, is_absent, remarks } = rec

      const result = await client.query(`
        INSERT INTO marks
          (exam_id, student_id, subject_id, marks_obtained, max_marks, is_absent, remarks, entered_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (exam_id, student_id, subject_id)
        DO UPDATE SET
          marks_obtained = EXCLUDED.marks_obtained,
          max_marks      = EXCLUDED.max_marks,
          is_absent      = EXCLUDED.is_absent,
          remarks        = EXCLUDED.remarks,
          updated_at     = NOW()
        RETURNING *
      `, [
        exam_id, student_id, subject_id,
        is_absent ? 0 : marks_obtained,
        max_marks || 100,
        is_absent || false,
        remarks || null,
        req.user.id,
      ])

      results.push(result.rows[0])
    }

    await client.query('COMMIT')
    res.status(201).json({
      message: `Marks saved for ${results.length} students.`,
      records: results,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to save marks.' })
  } finally {
    client.release()
  }
}

// GET /api/marks/:examId/:subjectId
// Marks sheet for a subject in an exam — used by teacher for entry
const getMarksSheet = async (req, res) => {
  const { examId, subjectId } = req.params
  try {
    // Get exam to find class_id
    const examResult = await pool.query(
      'SELECT * FROM exams WHERE id=$1', [examId]
    )
    if (!examResult.rows[0])
      return res.status(404).json({ error: 'Exam not found.' })

    const { class_id } = examResult.rows[0]

    // Get all students in the class
    const students = await pool.query(`
      SELECT s.id AS student_id, u.name, s.roll_no
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.class_id = $1
      ORDER BY s.roll_no, u.name
    `, [class_id])

    // Get existing marks
    const existing = await pool.query(`
      SELECT student_id, marks_obtained, max_marks, is_absent, remarks
      FROM marks
      WHERE exam_id=$1 AND subject_id=$2
    `, [examId, subjectId])

    const existingMap = {}
    existing.rows.forEach(r => { existingMap[r.student_id] = r })

    const merged = students.rows.map(s => ({
      student_id:     s.student_id,
      name:           s.name,
      roll_no:        s.roll_no,
      marks_obtained: existingMap[s.student_id]?.marks_obtained ?? '',
      max_marks:      existingMap[s.student_id]?.max_marks      ?? 100,
      is_absent:      existingMap[s.student_id]?.is_absent      ?? false,
      remarks:        existingMap[s.student_id]?.remarks         ?? '',
      entered:        !!existingMap[s.student_id],
    }))

    res.json({
      exam:     examResult.rows[0],
      students: merged,
      is_entered: existing.rows.length > 0,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch marks sheet.' })
  }
}

// GET /api/marks/student/:studentId?exam_id=1
// All marks for a student, optionally filtered by exam
const getStudentMarks = async (req, res) => {
  const { studentId } = req.params
  const { exam_id }   = req.query

  try {
    const result = await pool.query(`
      SELECT
        m.*,
        sub.name AS subject_name,
        sub.code AS subject_code,
        e.name   AS exam_name,
        e.academic_year
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e      ON m.exam_id    = e.id
      WHERE m.student_id = $1
        ${exam_id ? 'AND m.exam_id = $2' : ''}
      ORDER BY e.start_date, sub.name
    `, exam_id ? [studentId, exam_id] : [studentId])

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch marks.' })
  }
}

// GET /api/marks/report-card/:studentId/:examId
// Full report card data — marks + grades + rank
const getReportCard = async (req, res) => {
  const { studentId, examId } = req.params
  try {
    // Student info
    const studentResult = await pool.query(`
      SELECT s.*, u.name, u.email, s.roll_no,
             c.name AS class_name, c.section, c.academic_year
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [studentId])

    if (!studentResult.rows[0])
      return res.status(404).json({ error: 'Student not found.' })

    // Exam info
    const examResult = await pool.query(
      'SELECT * FROM exams WHERE id=$1', [examId]
    )
    if (!examResult.rows[0])
      return res.status(404).json({ error: 'Exam not found.' })

    if (!examResult.rows[0].is_published)
      return res.status(403).json({ error: 'Results not published yet.' })

    // Marks for this student in this exam
    const marksResult = await pool.query(`
      SELECT
        m.marks_obtained,
        m.max_marks,
        m.is_absent,
        m.remarks,
        sub.name AS subject_name,
        sub.code AS subject_code
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id=$1 AND m.exam_id=$2
      ORDER BY sub.name
    `, [studentId, examId])

    if (!marksResult.rows.length)
      return res.status(404).json({ error: 'No marks found for this student in this exam.' })

    // Calculate result
    const result = calculateResult(marksResult.rows)

    // Calculate class rank
    const allStudentTotals = await pool.query(`
      SELECT
        student_id,
        SUM(marks_obtained) AS total
      FROM marks
      WHERE exam_id = $1 AND is_absent = false
      GROUP BY student_id
      ORDER BY total DESC
    `, [examId])

    const rankIndex = allStudentTotals.rows.findIndex(
      r => parseInt(r.student_id) === parseInt(studentId)
    )
    const rank          = rankIndex >= 0 ? rankIndex + 1 : null
    const total_students = allStudentTotals.rows.length

    const student = studentResult.rows[0]
    const exam    = examResult.rows[0]

    res.json({
      student: {
        name:    student.name,
        roll_no: student.roll_no,
        email:   student.email,
      },
      exam:          { id: exam.id, name: exam.name },
      class_name:    student.class_name,
      section:       student.section,
      academic_year: student.academic_year,
      result,
      rank,
      total_students,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate report card.' })
  }
}

// GET /api/marks/report-card/:studentId/:examId/pdf
const downloadReportCard = async (req, res) => {
  const { studentId, examId } = req.params

  // Reuse getReportCard logic inline
  try {
    const studentResult = await pool.query(`
      SELECT s.*, u.name, s.roll_no,
             c.name AS class_name, c.section, c.academic_year
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [studentId])

    const examResult = await pool.query(
      'SELECT * FROM exams WHERE id=$1', [examId]
    )

    if (!examResult.rows[0]?.is_published)
      return res.status(403).json({ error: 'Results not published yet.' })

    const marksResult = await pool.query(`
      SELECT m.marks_obtained, m.max_marks, m.is_absent, m.remarks,
             sub.name AS subject_name, sub.code AS subject_code
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id=$1 AND m.exam_id=$2
      ORDER BY sub.name
    `, [studentId, examId])

    if (!marksResult.rows.length)
      return res.status(404).json({ error: 'No marks found.' })

    const result = calculateResult(marksResult.rows)

    const allTotals = await pool.query(`
      SELECT student_id, SUM(marks_obtained) AS total
      FROM marks WHERE exam_id=$1 AND is_absent=false
      GROUP BY student_id ORDER BY total DESC
    `, [examId])

    const rankIndex     = allTotals.rows.findIndex(r => parseInt(r.student_id) === parseInt(studentId))
    const rank          = rankIndex >= 0 ? rankIndex + 1 : null
    const total_students = allTotals.rows.length
    const student        = studentResult.rows[0]
    const exam           = examResult.rows[0]

    generateReportCardPDF(res, {
      student:       { name: student.name, roll_no: student.roll_no },
      exam:          { id: exam.id, name: exam.name },
      className:     student.class_name,
      section:       student.section,
      academicYear:  student.academic_year,
      result,
      rank,
      total_students,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate PDF.' })
  }
}

module.exports = {
  enterMarks,
  getMarksSheet,
  getStudentMarks,
  getReportCard,
  downloadReportCard,
}