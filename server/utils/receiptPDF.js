const PDFDocument = require('pdfkit')

// ── Single Payment Receipt ────────────────────────────────────────────
const generateReceiptPDF = (res, data) => {
  const { payment, student } = data

  const doc = new PDFDocument({ margin: 50, size: 'A5' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="receipt-${payment.receipt_no}.pdf"`
  )
  doc.pipe(res)

  const W       = 395  // A5 usable width
  const PRIMARY = '#2563eb'
  const DARK    = '#1e293b'
  const GRAY    = '#64748b'
  const LIGHT   = '#f8fafc'
  const GREEN   = '#16a34a'

  // ── Header ─────────────────────────────────────────────────────────
  doc.rect(50, 50, W, 60).fill(PRIMARY)
  doc.fillColor('white')
     .fontSize(16).font('Helvetica-Bold')
     .text('SCHOOL MANAGEMENT SYSTEM', 50, 62, { width: W, align: 'center' })
  doc.fontSize(9).font('Helvetica')
     .text('Official Fee Receipt', 50, 84, { width: W, align: 'center' })

  // ── Receipt badge ──────────────────────────────────────────────────
  doc.rect(50, 122, W, 28).fill(LIGHT)
  doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold')
     .text('RECEIPT', 60, 130)
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text(payment.receipt_no, 50, 130, { width: W - 10, align: 'right' })

  // ── Student info ───────────────────────────────────────────────────
  const infoY = 162
  doc.rect(50, infoY, W, 75).fill(LIGHT).stroke('#e2e8f0')

  const drawInfoRow = (label, value, y) => {
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text(label, 62, y)
    doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
       .text(value || '—', 180, y)
  }

  drawInfoRow('Student Name:',  student.name,               infoY + 10)
  drawInfoRow('Class:',         `${student.class_name} — ${student.section}`, infoY + 26)
  drawInfoRow('Payment Date:',  new Date(payment.payment_date)
                                  .toLocaleDateString('en-IN', { dateStyle: 'long' }), infoY + 42)
  drawInfoRow('Payment Method:', payment.method.replace('_', ' ').toUpperCase(), infoY + 58)

  // ── Amount box ─────────────────────────────────────────────────────
  const amtY = infoY + 85
  doc.rect(50, amtY, W, 55).fill(PRIMARY)

  doc.fillColor('white').fontSize(11).font('Helvetica')
     .text('Amount Received', 50, amtY + 10, { width: W, align: 'center' })
  doc.fontSize(22).font('Helvetica-Bold')
     .text(
       `₹ ${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
       50, amtY + 26, { width: W, align: 'center' }
     )

  // ── Fee details ────────────────────────────────────────────────────
  const detY = amtY + 65
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
     .text('FEE DETAILS', 50, detY)

  doc.rect(50, detY + 15, W, 22).fill('#e2e8f0')
  doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold')
     .text('Description',   60,        detY + 21)
     .text('Amount',        50,        detY + 21, { width: W - 10, align: 'right' })

  doc.rect(50, detY + 37, W, 22).fill(LIGHT)
  doc.fillColor(DARK).fontSize(9).font('Helvetica')
     .text(payment.fee_type, 60, detY + 43)
  doc.font('Helvetica-Bold')
     .text(
       `₹ ${parseFloat(payment.amount).toLocaleString('en-IN')}`,
       50, detY + 43, { width: W - 10, align: 'right' }
     )

  if (payment.notes) {
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text(`Note: ${payment.notes}`, 60, detY + 68)
  }

  // ── Paid stamp ─────────────────────────────────────────────────────
  doc.save()
  doc.rotate(-25, { origin: [330, detY + 50] })
  doc.rect(270, detY + 30, 90, 36).stroke(GREEN)
  doc.fillColor(GREEN).fontSize(18).font('Helvetica-Bold')
     .text('PAID', 278, detY + 42)
  doc.restore()

  // ── Footer ─────────────────────────────────────────────────────────
  const footY = 490
  doc.rect(50, footY, W, 0.5).fill('#e2e8f0')
  doc.fillColor(GRAY).fontSize(7).font('Helvetica')
     .text(
       `Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}   |   This is a computer-generated receipt.`,
       50, footY + 8, { width: W, align: 'center' }
     )

  doc.end()
}

// ── Full Student Invoice ──────────────────────────────────────────────
const generateInvoicePDF = (res, data) => {
  const { student, dues, payments, summary, academic_year } = data

  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${student.name.replace(/\s+/g,'_')}.pdf"`
  )
  doc.pipe(res)

  const W       = 495
  const PRIMARY = '#2563eb'
  const DARK    = '#1e293b'
  const GRAY    = '#64748b'
  const LIGHT   = '#f8fafc'
  const GREEN   = '#16a34a'
  const RED     = '#dc2626'

  // ── Header ─────────────────────────────────────────────────────────
  doc.rect(50, 50, W, 65).fill(PRIMARY)
  doc.fillColor('white')
     .fontSize(18).font('Helvetica-Bold')
     .text('SCHOOL MANAGEMENT SYSTEM', 50, 64, { width: W, align: 'center' })
  doc.fontSize(10).font('Helvetica')
     .text('Student Fee Invoice', 50, 88, { width: W, align: 'center' })

  // Invoice meta
  const metaY = 127
  doc.rect(50, metaY, W, 26).fill(LIGHT)
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(`Academic Year: ${academic_year}`, 60, metaY + 8)
  doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
     .text(
       `Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
       50, metaY + 8, { width: W - 10, align: 'right' }
     )

  // Student info
  const siY = metaY + 36
  doc.rect(50, siY, W, 55).stroke('#e2e8f0')
  doc.fillColor(DARK).fontSize(9)

  const si = [
    ['Student Name',  student.name],
    ['Class',         `${student.class_name} — ${student.section}`],
  ]
  si.forEach(([label, val], i) => {
    const y = siY + 10 + i * 18
    doc.font('Helvetica').fillColor(GRAY).text(label + ':', 62, y)
    doc.font('Helvetica-Bold').fillColor(DARK).text(val, 200, y)
  })

  // ── Fee Dues table ─────────────────────────────────────────────────
  const duesY = siY + 65
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text('FEE DUES', 50, duesY)

  const rowH  = 22
  const tY    = duesY + 16

  // Header row
  doc.rect(50, tY, W, rowH).fill(PRIMARY)
  doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
  const dCols = [
    ['Fee Type',   60,  140],
    ['Frequency',  200, 80],
    ['Due Amount', 285, 80],
    ['Paid',       368, 70],
    ['Balance',    440, 55],
  ]
  dCols.forEach(([label, x, w]) => {
    doc.text(label, x, tY + 8, { width: w })
  })

  dues.forEach((due, i) => {
    const ry     = tY + rowH + i * rowH
    const isEven = i % 2 === 0
    doc.rect(50, ry, W, rowH).fill(isEven ? LIGHT : 'white')
    doc.fillColor(DARK).fontSize(8).font('Helvetica')
    doc.text(due.fee_type,              60,  ry + 8, { width: 140 })
    doc.text(due.frequency,             200, ry + 8, { width: 80 })
    doc.text(`₹${due.total_due.toLocaleString('en-IN')}`,  285, ry + 8, { width: 80 })
    doc.text(`₹${due.paid.toLocaleString('en-IN')}`,       368, ry + 8, { width: 70 })
    doc.fillColor(due.balance > 0 ? RED : GREEN).font('Helvetica-Bold')
    doc.text(`₹${due.balance.toLocaleString('en-IN')}`,    440, ry + 8, { width: 55 })
  })

  const duesTableBottom = tY + rowH + dues.length * rowH
  doc.rect(50, tY, W, duesTableBottom - tY).stroke('#e2e8f0')

  // ── Summary ────────────────────────────────────────────────────────
  const sumY = duesTableBottom + 15
  doc.rect(50, sumY, W, 50).fill(LIGHT).stroke('#e2e8f0')

  const sumItems = [
    { label: 'Total Due',     val: `₹${summary.total_due.toLocaleString('en-IN')}`,     color: DARK  },
    { label: 'Total Paid',    val: `₹${summary.total_paid.toLocaleString('en-IN')}`,    color: GREEN },
    { label: 'Balance Due',   val: `₹${summary.total_balance.toLocaleString('en-IN')}`, color: summary.total_balance > 0 ? RED : GREEN },
  ]
  const colW = W / 3
  sumItems.forEach((s, i) => {
    const x = 50 + i * colW
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text(s.label, x + 10, sumY + 10, { width: colW - 10, align: 'center' })
    doc.fillColor(s.color).fontSize(12).font('Helvetica-Bold')
       .text(s.val, x + 10, sumY + 26, { width: colW - 10, align: 'center' })
  })

  // ── Payment History table ──────────────────────────────────────────
  if (payments.length > 0) {
    const phY = sumY + 65
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
       .text('PAYMENT HISTORY', 50, phY)

    const phT = phY + 16

    doc.rect(50, phT, W, rowH).fill(PRIMARY)
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
    const pCols = [
      ['Receipt No',  60,  110],
      ['Fee Type',    175, 110],
      ['Date',        290, 90],
      ['Method',      383, 75],
      ['Amount',      460, 55],
    ]
    pCols.forEach(([label, x, w]) => doc.text(label, x, phT + 8, { width: w }))

    payments.slice(0, 12).forEach((p, i) => {
      const ry     = phT + rowH + i * rowH
      const isEven = i % 2 === 0
      doc.rect(50, ry, W, rowH).fill(isEven ? LIGHT : 'white')
      doc.fillColor(DARK).fontSize(8).font('Helvetica')
      doc.text(p.receipt_no,          60,  ry + 8, { width: 110 })
      doc.text(p.fee_type,            175, ry + 8, { width: 110 })
      doc.text(new Date(p.payment_date).toLocaleDateString('en-IN'), 290, ry + 8, { width: 90 })
      doc.text(p.method.replace('_',' '), 383, ry + 8, { width: 75 })
      doc.fillColor(GREEN).font('Helvetica-Bold')
         .text(`₹${parseFloat(p.amount).toLocaleString('en-IN')}`, 460, ry + 8, { width: 55 })
    })

    const phBottom = phT + rowH + Math.min(payments.length, 12) * rowH
    doc.rect(50, phT, W, phBottom - phT).stroke('#e2e8f0')
  }

  // ── Footer ─────────────────────────────────────────────────────────
  const footY = 760
  doc.rect(50, footY, W, 0.5).fill('#e2e8f0')
  doc.fillColor(GRAY).fontSize(7).font('Helvetica')
     .text(
       `Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}   |   This is a system-generated invoice.`,
       50, footY + 8, { width: W, align: 'center' }
     )

  doc.end()
}

module.exports = { generateReceiptPDF, generateInvoicePDF }