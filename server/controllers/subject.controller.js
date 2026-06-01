const pool = require('../config/db')

// GET /api/subjects
const getAllSubjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.code,
        s.class_id,
        c.name AS class_name,
        c.section,
        u.name AS teacher_name,
        t.id AS teacher_id
      FROM subjects s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY c.name, s.name
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects.' })
  }
}

// GET /api/subjects/:id
const getSubjectById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name AS class_name, c.section, u.name AS teacher_name
      FROM subjects s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE s.id = $1
    `, [req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Subject not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject.' })
  }
}

// POST /api/subjects
const createSubject = async (req, res) => {
  const { name, code, class_id, teacher_id } = req.body

  if (!name || !code || !class_id) {
    return res.status(400).json({ error: 'Name, code, and class are required.' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO subjects (name, code, class_id, teacher_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, code.toUpperCase(), class_id, teacher_id || null])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Subject code already exists.' })
    res.status(500).json({ error: 'Failed to create subject.' })
  }
}

// PUT /api/subjects/:id
const updateSubject = async (req, res) => {
  const { name, code, class_id, teacher_id } = req.body
  try {
    const result = await pool.query(`
      UPDATE subjects
      SET name=$1, code=$2, class_id=$3, teacher_id=$4, updated_at=NOW()
      WHERE id=$5
      RETURNING *
    `, [name, code.toUpperCase(), class_id, teacher_id || null, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Subject not found.' })

    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Subject code already exists.' })
    res.status(500).json({ error: 'Failed to update subject.' })
  }
}

// DELETE /api/subjects/:id
const deleteSubject = async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id])
    res.json({ message: 'Subject deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subject.' })
  }
}

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
}