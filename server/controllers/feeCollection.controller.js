const pool = require('../config/db')
const { generateReceiptNo } = require('../utils/receipt')

// POST /api/fees/pay
// Record a fee payment for a student
const recordPayment = async (req, res) => {
  const {
    student_id, fee_type, amount,
    payment_date, method, academic_year,
    month_year, notes,
  } = req.body

  if (!student_id || !fee_type || !amount || !method)
    return res.status(400).json({ error: 'student_id, fee_type, amount and method are required.' })

  const receipt_no = generateReceiptNo()

  try {
    const result = await pool.query(`
      INSERT INTO fee_payments
        (student_id, fee_type, amount, payment_date,
         method, receipt_no, academic_year, month_year, notes, recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      student_id, fee_type, amount,
      payment_date || new Date().toISOString().split('T')[0],
      method,
      receipt_no,
      academic_year || '2024-25',
      month_year || null,
      notes || null,
      req.user.id,
    ])

    res.status(201).json({
      message:    'Payment recorded successfully.',
      payment:    result.rows[0],
      receipt_no,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to record payment.' })
  }
}

// GET /api/fees/student/:studentId
// Full fee status for a student — what they owe + what they've paid
const getStudentFeeStatus = async (req, res) => {
  const { studentId } = req.params
  const { academic_year } = req.query

  try {
    // Get student + class info
    const studentResult = await pool.query(`
      SELECT s.*, u.name, c.name AS class_name, c.section
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [studentId])

    if (!studentResult.rows[0])
      return res.status(404).json({ error: 'Student not found.' })

    const student  = studentResult.rows[0]
    const ay       = academic_year || '2024-25'

    // Get fee structure for the student's class
    const structure = await pool.query(`
      SELECT * FROM fees_structure
      WHERE class_id = $1 AND academic_year = $2
      ORDER BY fee_type
    `, [student.class_id, ay])

    // Get all payments by this student
    const payments = await pool.query(`
      SELECT * FROM fee_payments
      WHERE student_id = $1 AND academic_year = $2
      ORDER BY payment_date DESC
    `, [studentId, ay])

    // Calculate paid per fee_type
    const paidMap = {}
    payments.rows.forEach(p => {
      paidMap[p.fee_type] = (paidMap[p.fee_type] || 0) + parseFloat(p.amount)
    })

    // Build dues summary per fee type
    const dues = structure.rows.map(fee => {
      const paid       = paidMap[fee.fee_type] || 0
      const total_due  = parseFloat(fee.amount)
      const balance    = parseFloat((total_due - paid).toFixed(2))
      return {
        fee_type:    fee.fee_type,
        frequency:   fee.frequency,
        total_due,
        paid:        parseFloat(paid.toFixed(2)),
        balance,
        status:      balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
      }
    })

    const totalDue     = dues.reduce((s, d) => s + d.total_due, 0)
    const totalPaid    = dues.reduce((s, d) => s + d.paid, 0)
    const totalBalance = parseFloat((totalDue - totalPaid).toFixed(2))

    res.json({
      student: {
        id:         student.id,
        name:       student.name,
        class_name: student.class_name,
        section:    student.section,
      },
      dues,
      payments:      payments.rows,
      summary: {
        total_due:     parseFloat(totalDue.toFixed(2)),
        total_paid:    parseFloat(totalPaid.toFixed(2)),
        total_balance: totalBalance,
        status:        totalBalance <= 0 ? 'cleared' : totalPaid > 0 ? 'partial' : 'pending',
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch fee status.' })
  }
}

// GET /api/fees/collection
// Admin: daily/monthly collection summary
const getCollectionSummary = async (req, res) => {
  const { from, to, method } = req.query
  const today      = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0,8) + '01'

  try {
    const params  = [from || monthStart, to || today]
    let   extra   = ''
    let   idx     = 3

    if (method) {
      extra = ` AND method = $${idx++}`
      params.push(method)
    }

    // Daily totals
    const daily = await pool.query(`
      SELECT
        payment_date,
        COUNT(*)              AS transactions,
        SUM(amount)           AS total_collected,
        method
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2 ${extra}
      GROUP BY payment_date, method
      ORDER BY payment_date DESC
    `, params)

    // Overall totals for range
    const totals = await pool.query(`
      SELECT
        COUNT(*)     AS total_transactions,
        SUM(amount)  AS total_collected,
        method
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2 ${extra}
      GROUP BY method
    `, params)

    // Fee-type breakdown
    const byType = await pool.query(`
      SELECT
        fee_type,
        COUNT(*)    AS transactions,
        SUM(amount) AS total_collected
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2 ${extra}
      GROUP BY fee_type
      ORDER BY total_collected DESC
    `, params)

    res.json({
      range:  { from: from || monthStart, to: to || today },
      daily:  daily.rows,
      totals: totals.rows,
      by_type: byType.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch collection summary.' })
  }
}

// GET /api/fees/outstanding
// All students with pending dues
const getOutstandingDues = async (req, res) => {
  const { class_id, academic_year } = req.query
  const ay = academic_year || '2024-25'

  try {
    // Get all students (optionally filtered by class)
    const studentsResult = await pool.query(`
      SELECT s.id, u.name, s.roll_no, s.class_id,
             c.name AS class_name, c.section
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      ${class_id ? 'WHERE s.class_id = $1' : ''}
      ORDER BY c.name, s.roll_no
    `, class_id ? [class_id] : [])

    const outstanding = []

    for (const student of studentsResult.rows) {
      // Fee structure for student's class
      const structure = await pool.query(`
        SELECT SUM(amount) AS total_due
        FROM fees_structure
        WHERE class_id = $1 AND academic_year = $2
      `, [student.class_id, ay])

      // Total paid by student
      const paid = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM fee_payments
        WHERE student_id = $1 AND academic_year = $2
      `, [student.id, ay])

      const total_due  = parseFloat(structure.rows[0]?.total_due || 0)
      const total_paid = parseFloat(paid.rows[0]?.total_paid || 0)
      const balance    = parseFloat((total_due - total_paid).toFixed(2))

      if (balance > 0) {
        outstanding.push({
          student_id:  student.id,
          name:        student.name,
          roll_no:     student.roll_no,
          class_name:  student.class_name,
          section:     student.section,
          total_due,
          total_paid,
          balance,
          status:      total_paid > 0 ? 'partial' : 'pending',
        })
      }
    }

    // Sort by highest balance first
    outstanding.sort((a, b) => b.balance - a.balance)

    res.json({
      total_outstanding: outstanding.reduce((s, o) => s + o.balance, 0).toFixed(2),
      count:  outstanding.length,
      students: outstanding,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch outstanding dues.' })
  }
}

module.exports = {
  recordPayment,
  getStudentFeeStatus,
  getCollectionSummary,
  getOutstandingDues,
}