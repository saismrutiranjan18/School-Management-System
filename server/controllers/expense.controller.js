const pool = require('../config/db')

const CATEGORIES = [
  'Salaries', 'Utilities', 'Maintenance', 'Stationery',
  'Equipment', 'Events', 'Transport', 'Other',
]

// GET /api/expenses
const getAllExpenses = async (req, res) => {
  const { from, to, category } = req.query
  const today      = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  try {
    const params  = [from || monthStart, to || today]
    let   extra   = ''
    let   idx     = 3

    if (category) {
      extra += ` AND category = $${idx++}`
      params.push(category)
    }

    const result = await pool.query(`
      SELECT
        e.*,
        u.name AS recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE e.expense_date BETWEEN $1 AND $2 ${extra}
      ORDER BY e.expense_date DESC
    `, params)

    // Category summary
    const summary = await pool.query(`
      SELECT
        category,
        COUNT(*)    AS count,
        SUM(amount) AS total
      FROM expenses
      WHERE expense_date BETWEEN $1 AND $2 ${extra}
      GROUP BY category
      ORDER BY total DESC
    `, params)

    const totalExpense = result.rows.reduce(
      (sum, e) => sum + parseFloat(e.amount), 0
    )

    res.json({
      expenses:      result.rows,
      by_category:   summary.rows,
      total_expense: parseFloat(totalExpense.toFixed(2)),
      range:         { from: from || monthStart, to: to || today },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch expenses.' })
  }
}

// POST /api/expenses
const createExpense = async (req, res) => {
  const { title, category, amount, expense_date, description } = req.body

  if (!title || !category || !amount)
    return res.status(400).json({ error: 'title, category and amount are required.' })

  if (!CATEGORIES.includes(category))
    return res.status(400).json({ error: `Invalid category. Valid: ${CATEGORIES.join(', ')}` })

  try {
    const result = await pool.query(`
      INSERT INTO expenses (title, category, amount, expense_date, description, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      title, category, amount,
      expense_date || new Date().toISOString().split('T')[0],
      description || null,
      req.user.id,
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense.' })
  }
}

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  const { title, category, amount, expense_date, description } = req.body
  try {
    const result = await pool.query(`
      UPDATE expenses
      SET title=$1, category=$2, amount=$3, expense_date=$4, description=$5
      WHERE id=$6
      RETURNING *
    `, [title, category, amount, expense_date, description || null, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Expense not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense.' })
  }
}

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1', [req.params.id])
    res.json({ message: 'Expense deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense.' })
  }
}

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense }