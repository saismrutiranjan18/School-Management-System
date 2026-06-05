const pool = require('../config/db')
const { generateReceiptPDF, generateInvoicePDF } = require('../utils/receiptPDF')

// GET /api/fees/receipt/:receiptNo
const downloadReceipt = async (req, res) => {
  const { receiptNo } = req.params
  try {
    // Get payment
    const payResult = await pool.query(
      'SELECT * FROM fee_payments WHERE receipt_no = $1',
      [receiptNo]
    )
    if (!payResult.rows[0])
      return res.status(404).json({ error: 'Receipt not found.' })

    const payment = payResult.rows[0]

    // Get student info
    const studentResult = await pool.query(`
      SELECT s.*, u.name, c.name AS class_name, c.section
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [payment.student_id])

    if (!studentResult.rows[0])
      return res.status(404).json({ error: 'Student not found.' })

    generateReceiptPDF(res, {
      payment,
      student: studentResult.rows[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate receipt.' })
  }
}

// GET /api/fees/invoice/:studentId
const downloadInvoice = async (req, res) => {
  const { studentId }   = req.params
  const { academic_year } = req.query
  const ay              = academic_year || '2024-25'

  try {
    // Student info
    const studentResult = await pool.query(`
      SELECT s.*, u.name, c.name AS class_name, c.section
      FROM students s
      JOIN users u   ON s.user_id  = u.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [studentId])

    if (!studentResult.rows[0])
      return res.status(404).json({ error: 'Student not found.' })

    const student = studentResult.rows[0]

    // Fee structure for class
    const structure = await pool.query(`
      SELECT * FROM fees_structure
      WHERE class_id = $1 AND academic_year = $2
      ORDER BY fee_type
    `, [student.class_id, ay])

    // All payments by student
    const paymentsResult = await pool.query(`
      SELECT * FROM fee_payments
      WHERE student_id = $1 AND academic_year = $2
      ORDER BY payment_date DESC
    `, [studentId, ay])

    // Build dues
    const paidMap = {}
    paymentsResult.rows.forEach(p => {
      paidMap[p.fee_type] = (paidMap[p.fee_type] || 0) + parseFloat(p.amount)
    })

    const dues = structure.rows.map(fee => {
      const paid      = paidMap[fee.fee_type] || 0
      const total_due = parseFloat(fee.amount)
      const balance   = parseFloat((total_due - paid).toFixed(2))
      return {
        fee_type:  fee.fee_type,
        frequency: fee.frequency,
        total_due,
        paid:      parseFloat(paid.toFixed(2)),
        balance,
        status:    balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
      }
    })

    const total_due     = dues.reduce((s, d) => s + d.total_due, 0)
    const total_paid    = dues.reduce((s, d) => s + d.paid, 0)
    const total_balance = parseFloat((total_due - total_paid).toFixed(2))

    generateInvoicePDF(res, {
      student,
      dues,
      payments:      paymentsResult.rows,
      summary: {
        total_due:     parseFloat(total_due.toFixed(2)),
        total_paid:    parseFloat(total_paid.toFixed(2)),
        total_balance,
      },
      academic_year: ay,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate invoice.' })
  }
}

module.exports = { downloadReceipt, downloadInvoice }