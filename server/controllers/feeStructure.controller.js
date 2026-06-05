const pool = require('../config/db')

// GET /api/fees/structure?class_id=1&academic_year=2024-25
const getAllFeeStructures = async (req, res) => {
  const { class_id, academic_year } = req.query
  try {
    let query = `
      SELECT
        fs.*,
        c.name    AS class_name,
        c.section
      FROM fees_structure fs
      JOIN classes c ON fs.class_id = c.id
      WHERE 1=1
    `
    const params = []
    let idx = 1

    if (class_id) {
      query += ` AND fs.class_id = $${idx++}`
      params.push(class_id)
    }
    if (academic_year) {
      query += ` AND fs.academic_year = $${idx++}`
      params.push(academic_year)
    }

    query += ' ORDER BY c.name, c.section, fs.fee_type'

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch fee structures.' })
  }
}

// GET /api/fees/structure/class/:classId
const getFeeStructureByClass = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM fees_structure
      WHERE class_id = $1
      ORDER BY fee_type
    `, [req.params.classId])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fee structure.' })
  }
}

// POST /api/fees/structure
const createFeeStructure = async (req, res) => {
  const { class_id, fee_type, amount, frequency, academic_year, description } = req.body

  if (!class_id || !fee_type || !amount || !frequency)
    return res.status(400).json({ error: 'class_id, fee_type, amount and frequency are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO fees_structure
        (class_id, fee_type, amount, frequency, academic_year, description)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [class_id, fee_type, amount, frequency, academic_year || '2024-25', description || null])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Fee type already exists for this class.' })
    res.status(500).json({ error: 'Failed to create fee structure.' })
  }
}

// PUT /api/fees/structure/:id
const updateFeeStructure = async (req, res) => {
  const { fee_type, amount, frequency, description } = req.body
  try {
    const result = await pool.query(`
      UPDATE fees_structure
      SET fee_type=$1, amount=$2, frequency=$3, description=$4
      WHERE id=$5
      RETURNING *
    `, [fee_type, amount, frequency, description || null, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Fee structure not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update fee structure.' })
  }
}

// DELETE /api/fees/structure/:id
const deleteFeeStructure = async (req, res) => {
  try {
    await pool.query('DELETE FROM fees_structure WHERE id=$1', [req.params.id])
    res.json({ message: 'Fee structure deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete fee structure.' })
  }
}

module.exports = {
  getAllFeeStructures,
  getFeeStructureByClass,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
}