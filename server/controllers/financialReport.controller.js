const pool   = require('../config/db')
const PDFDocument = require('pdfkit')

// GET /api/fees/report/financial
// Full financial summary: revenue (fees) vs expenses, month by month
const getFinancialReport = async (req, res) => {
  const { from, to, academic_year } = req.query
  const today      = new Date().toISOString().split('T')[0]
  const yearStart  = today.slice(0, 4) + '-04-01'  // April = Indian FY start
  const ay         = academic_year || '2024-25'

  const dateFrom = from || yearStart
  const dateTo   = to   || today

  try {
    // ── Monthly fee collection ────────────────────────────────────────
    const monthlyCollection = await pool.query(`
      SELECT
        TO_CHAR(payment_date, 'YYYY-MM') AS month,
        SUM(amount)                      AS total_collected,
        COUNT(*)                         AS transactions
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2
        AND academic_year = $3
      GROUP BY month
      ORDER BY month
    `, [dateFrom, dateTo, ay])

    // ── Monthly expenses ──────────────────────────────────────────────
    const monthlyExpenses = await pool.query(`
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM') AS month,
        SUM(amount)                      AS total_expenses
      FROM expenses
      WHERE expense_date BETWEEN $1 AND $2
      GROUP BY month
      ORDER BY month
    `, [dateFrom, dateTo])

    // ── Fee collection by type ────────────────────────────────────────
    const collectionByType = await pool.query(`
      SELECT
        fee_type,
        COUNT(*)    AS transactions,
        SUM(amount) AS total
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2
        AND academic_year = $3
      GROUP BY fee_type
      ORDER BY total DESC
    `, [dateFrom, dateTo, ay])

    // ── Expenses by category ─────────────────────────────────────────
    const expenseByCategory = await pool.query(`
      SELECT
        category,
        COUNT(*)    AS count,
        SUM(amount) AS total
      FROM expenses
      WHERE expense_date BETWEEN $1 AND $2
      GROUP BY category
      ORDER BY total DESC
    `, [dateFrom, dateTo])

    // ── Overall totals ────────────────────────────────────────────────
    const totalRevenue = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM fee_payments
      WHERE payment_date BETWEEN $1 AND $2
        AND academic_year = $3
    `, [dateFrom, dateTo, ay])

    const totalExpense = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE expense_date BETWEEN $1 AND $2
    `, [dateFrom, dateTo])

    // ── Pending dues (total outstanding) ─────────────────────────────
    const pendingDues = await pool.query(`
      SELECT
        COALESCE(SUM(fs.amount), 0) -
        COALESCE((
          SELECT SUM(fp.amount)
          FROM fee_payments fp
          WHERE fp.academic_year = $1
        ), 0) AS total_outstanding
      FROM fees_structure fs
      WHERE fs.academic_year = $1
    `, [ay])

    const revenue    = parseFloat(totalRevenue.rows[0].total)
    const expense    = parseFloat(totalExpense.rows[0].total)
    const netBalance = parseFloat((revenue - expense).toFixed(2))
    const outstanding = parseFloat(pendingDues.rows[0].total_outstanding || 0)

    // Merge monthly data
    const allMonths = new Set([
      ...monthlyCollection.rows.map(r => r.month),
      ...monthlyExpenses.rows.map(r => r.month),
    ])
    const expenseMap = {}
    monthlyExpenses.rows.forEach(r => { expenseMap[r.month] = parseFloat(r.total_expenses) })

    const monthly = [...allMonths].sort().map(month => {
      const col = monthlyCollection.rows.find(r => r.month === month)
      return {
        month,
        collected: col ? parseFloat(col.total_collected) : 0,
        expenses:  expenseMap[month] || 0,
        net:       parseFloat(
          ((col ? parseFloat(col.total_collected) : 0) - (expenseMap[month] || 0)).toFixed(2)
        ),
      }
    })

    res.json({
      range:          { from: dateFrom, to: dateTo },
      academic_year:  ay,
      summary: {
        total_revenue:     parseFloat(revenue.toFixed(2)),
        total_expense:     parseFloat(expense.toFixed(2)),
        net_balance:       netBalance,
        total_outstanding: parseFloat(outstanding.toFixed(2)),
      },
      monthly,
      collection_by_type: collectionByType.rows,
      expense_by_category: expenseByCategory.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate financial report.' })
  }
}

// GET /api/fees/report/financial/pdf
const downloadFinancialReportPDF = async (req, res) => {
  const { from, to, academic_year } = req.query
  const today     = new Date().toISOString().split('T')[0]
  const yearStart = today.slice(0, 4) + '-04-01'
  const ay        = academic_year || '2024-25'
  const dateFrom  = from || yearStart
  const dateTo    = to   || today

  try {
    // Reuse same queries inline
    const [colResult, expResult, colByType, expByCat] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(amount),0) AS total
        FROM fee_payments
        WHERE payment_date BETWEEN $1 AND $2 AND academic_year = $3
      `, [dateFrom, dateTo, ay]),
      pool.query(`
        SELECT COALESCE(SUM(amount),0) AS total
        FROM expenses
        WHERE expense_date BETWEEN $1 AND $2
      `, [dateFrom, dateTo]),
      pool.query(`
        SELECT fee_type, SUM(amount) AS total, COUNT(*) AS transactions
        FROM fee_payments
        WHERE payment_date BETWEEN $1 AND $2 AND academic_year = $3
        GROUP BY fee_type ORDER BY total DESC
      `, [dateFrom, dateTo, ay]),
      pool.query(`
        SELECT category, SUM(amount) AS total, COUNT(*) AS count
        FROM expenses
        WHERE expense_date BETWEEN $1 AND $2
        GROUP BY category ORDER BY total DESC
      `, [dateFrom, dateTo]),
    ])

    const revenue    = parseFloat(colResult.rows[0].total)
    const expense    = parseFloat(expResult.rows[0].total)
    const netBalance = parseFloat((revenue - expense).toFixed(2))

    // ── Build PDF ─────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="financial-report-${ay}.pdf"`
    )
    doc.pipe(res)

    const W       = 495
    const PRIMARY = '#2563eb'
    const DARK    = '#1e293b'
    const GRAY    = '#64748b'
    const LIGHT   = '#f8fafc'
    const GREEN   = '#16a34a'
    const RED     = '#dc2626'
    const rowH    = 22

    // Header
    doc.rect(50, 50, W, 65).fill(PRIMARY)
    doc.fillColor('white')
       .fontSize(18).font('Helvetica-Bold')
       .text('SCHOOL MANAGEMENT SYSTEM', 50, 64, { width: W, align: 'center' })
    doc.fontSize(10).font('Helvetica')
       .text('Financial Report', 50, 88, { width: W, align: 'center' })

    // Period row
    doc.rect(50, 127, W, 24).fill(LIGHT)
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text(
         `Period: ${new Date(dateFrom).toLocaleDateString('en-IN')} — ${new Date(dateTo).toLocaleDateString('en-IN')}   |   Academic Year: ${ay}`,
         50, 136, { width: W, align: 'center' }
       )

    // ── Summary boxes ─────────────────────────────────────────────────
    const sumY  = 163
    const boxW  = W / 4 - 4
    const boxes = [
      { label: 'Total Revenue',  value: `₹${revenue.toLocaleString('en-IN')}`,     color: GREEN   },
      { label: 'Total Expenses', value: `₹${expense.toLocaleString('en-IN')}`,     color: RED     },
      { label: 'Net Balance',    value: `₹${netBalance.toLocaleString('en-IN')}`,  color: netBalance >= 0 ? GREEN : RED },
    ]

    boxes.forEach((b, i) => {
      const x = 50 + i * (boxW + 6)
      doc.rect(x, sumY, boxW + 20, 55).fill(LIGHT).stroke('#e2e8f0')
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
         .text(b.label, x + 6, sumY + 8, { width: boxW + 8, align: 'center' })
      doc.fillColor(b.color).fontSize(13).font('Helvetica-Bold')
         .text(b.value, x + 6, sumY + 24, { width: boxW + 8, align: 'center' })
    })

    // ── Fee Collection by Type ─────────────────────────────────────────
    const ct1Y = sumY + 70
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
       .text('FEE COLLECTION BY TYPE', 50, ct1Y)

    doc.rect(50, ct1Y + 16, W, rowH).fill(PRIMARY)
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
    doc.text('Fee Type',     60,  ct1Y + 22, { width: 200 })
    doc.text('Transactions', 265, ct1Y + 22, { width: 100 })
    doc.text('Total Collected', 368, ct1Y + 22, { width: 120 })

    colByType.rows.forEach((row, i) => {
      const ry = ct1Y + 16 + rowH + i * rowH
      doc.rect(50, ry, W, rowH).fill(i % 2 === 0 ? LIGHT : 'white')
      doc.fillColor(DARK).fontSize(8).font('Helvetica')
      doc.text(row.fee_type,          60,  ry + 8, { width: 200 })
      doc.text(String(row.transactions), 265, ry + 8, { width: 100 })
      doc.fillColor(GREEN).font('Helvetica-Bold')
      doc.text(
        `₹${parseFloat(row.total).toLocaleString('en-IN')}`,
        368, ry + 8, { width: 120 }
      )
    })

    const ct1Bottom = ct1Y + 16 + rowH + colByType.rows.length * rowH
    doc.rect(50, ct1Y + 16, W, ct1Bottom - ct1Y - 16).stroke('#e2e8f0')

    // ── Expenses by Category ──────────────────────────────────────────
    const ct2Y = ct1Bottom + 20
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
       .text('EXPENSES BY CATEGORY', 50, ct2Y)

    doc.rect(50, ct2Y + 16, W, rowH).fill(PRIMARY)
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
    doc.text('Category',  60,  ct2Y + 22, { width: 200 })
    doc.text('Count',     265, ct2Y + 22, { width: 100 })
    doc.text('Total',     368, ct2Y + 22, { width: 120 })

    expByCat.rows.forEach((row, i) => {
      const ry = ct2Y + 16 + rowH + i * rowH
      doc.rect(50, ry, W, rowH).fill(i % 2 === 0 ? LIGHT : 'white')
      doc.fillColor(DARK).fontSize(8).font('Helvetica')
      doc.text(row.category,   60,  ry + 8, { width: 200 })
      doc.text(String(row.count), 265, ry + 8, { width: 100 })
      doc.fillColor(RED).font('Helvetica-Bold')
      doc.text(
        `₹${parseFloat(row.total).toLocaleString('en-IN')}`,
        368, ry + 8, { width: 120 }
      )
    })

    const ct2Bottom = ct2Y + 16 + rowH + expByCat.rows.length * rowH
    doc.rect(50, ct2Y + 16, W, ct2Bottom - ct2Y - 16).stroke('#e2e8f0')

    // Footer
    doc.rect(50, 760, W, 0.5).fill('#e2e8f0')
    doc.fillColor(GRAY).fontSize(7).font('Helvetica')
       .text(
         `Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}   |   School Management System`,
         50, 768, { width: W, align: 'center' }
       )

    doc.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate financial report PDF.' })
  }
}

module.exports = { getFinancialReport, downloadFinancialReportPDF }