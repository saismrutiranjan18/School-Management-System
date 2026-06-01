const pool = require('../config/db')

// GET /api/classes
const getAllClasses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.section,
        c.academic_year,
        u.name AS class_teacher_name,
        COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.id
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id, u.name
      ORDER BY c.name, c.section
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch classes.' })
  }
}

// GET /api/classes/:id
const getClassById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name AS class_teacher_name
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.id
      WHERE c.id = $1
    `, [req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Class not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class.' })
  }
}

// POST /api/classes
const createClass = async (req, res) => {
  const { name, section, academic_year, class_teacher_id } = req.body

  if (!name || !section) {
    return res.status(400).json({ error: 'Class name and section are required.' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO classes (name, section, academic_year, class_teacher_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, section, academic_year || '2024-25', class_teacher_id || null])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'This class and section already exists.' })
    res.status(500).json({ error: 'Failed to create class.' })
  }
}

// PUT /api/classes/:id
const updateClass = async (req, res) => {
  const { name, section, academic_year, class_teacher_id } = req.body
  try {
    const result = await pool.query(`
      UPDATE classes
      SET name=$1, section=$2, academic_year=$3, class_teacher_id=$4
      WHERE id=$5
      RETURNING *
    `, [name, section, academic_year, class_teacher_id || null, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Class not found.' })

    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'This class and section already exists.' })
    res.status(500).json({ error: 'Failed to update class.' })
  }
}

// DELETE /api/classes/:id
const deleteClass = async (req, res) => {
  try {
    // Check if students are assigned to this class
    const check = await pool.query(
      'SELECT COUNT(*) FROM students WHERE class_id = $1',
      [req.params.id]
    )
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete class with enrolled students. Reassign them first.',
      })
    }

    await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id])
    res.json({ message: 'Class deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete class.' })
  }
}

// GET /api/classes/:id/subjects
const getClassSubjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.code,
        u.name AS teacher_name,
        t.id AS teacher_id
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE s.class_id = $1
      ORDER BY s.name
    `, [req.params.id])

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects for this class.' })
  }
}

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassSubjects,
}