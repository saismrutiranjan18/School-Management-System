const pool = require('../config/db')

// GET /api/exams?class_id=1
const getAllExams = async (req, res) => {
  const { class_id } = req.query
  try {
    const result = await pool.query(`
      SELECT
        e.*,
        c.name    AS class_name,
        c.section,
        u.name    AS created_by_name
      FROM exams e
      JOIN classes c ON e.class_id  = c.id
      LEFT JOIN users u ON e.created_by = u.id
      ${class_id ? 'WHERE e.class_id = $1' : ''}
      ORDER BY e.start_date DESC
    `, class_id ? [class_id] : [])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch exams.' })
  }
}

// GET /api/exams/:id
const getExamById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.name AS class_name, c.section
      FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1
    `, [req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Exam not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exam.' })
  }
}

// POST /api/exams
const createExam = async (req, res) => {
  const { name, class_id, start_date, end_date, academic_year } = req.body

  if (!name || !class_id || !start_date || !end_date)
    return res.status(400).json({ error: 'All fields are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO exams (name, class_id, start_date, end_date, academic_year, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, class_id, start_date, end_date, academic_year || '2024-25', req.user.id])

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create exam.' })
  }
}

// PUT /api/exams/:id
const updateExam = async (req, res) => {
  const { name, start_date, end_date, is_published } = req.body
  try {
    const result = await pool.query(`
      UPDATE exams
      SET name=$1, start_date=$2, end_date=$3, is_published=$4
      WHERE id=$5
      RETURNING *
    `, [name, start_date, end_date, is_published, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Exam not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update exam.' })
  }
}

// DELETE /api/exams/:id
const deleteExam = async (req, res) => {
  try {
    await pool.query('DELETE FROM exams WHERE id=$1', [req.params.id])
    res.json({ message: 'Exam deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete exam.' })
  }
}

module.exports = { getAllExams, getExamById, createExam, updateExam, deleteExam }