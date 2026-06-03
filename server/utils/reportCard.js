const PDFDocument = require('pdfkit')

const generateReportCardPDF = (res, data) => {
  const {
    student, exam, className, section,
    academicYear, result,
  } = data

  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  // Pipe directly to HTTP response
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="report-card-${student.name.replace(/\s+/g, '_')}-${exam.name.replace(/\s+/g, '_')}.pdf"`
  )
  doc.pipe(res)

  const W       = 495  // usable width
  const PRIMARY = '#2563eb'
  const DARK    = '#1e293b'
  const GRAY    = '#64748b'
  const LIGHT   = '#f8fafc'
  const GREEN   = '#16a34a'
  const RED     = '#dc2626'

  // ── Header banner ───────────────────────────────────────────────────
  doc.rect(50, 50, W, 70).fill(PRIMARY)
  doc.fillColor('white')
     .fontSize(20).font('Helvetica-Bold')
     .text('SCHOOL MANAGEMENT SYSTEM', 50, 65, { width: W, align: 'center' })
  doc.fontSize(10).font('Helvetica')
     .text('STUDENT REPORT CARD', 50, 90, { width: W, align: 'center' })
  doc.moveDown()

  // ── Student info box ────────────────────────────────────────────────
  const infoY = 135
  doc.rect(50, infoY, W, 80).fill(LIGHT).stroke('#e2e8f0')

  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
  const col1X = 65, col2X = 300

  doc.text('Student Name:',  col1X, infoY + 12)
  doc.text('Class:',         col1X, infoY + 28)
  doc.text('Academic Year:', col1X, infoY + 44)
  doc.text('Exam:',          col1X, infoY + 60)

  doc.text('Roll No:',       col2X, infoY + 12)
  doc.text('Section:',       col2X, infoY + 28)

  doc.font('Helvetica').fillColor(GRAY)
  doc.text(student.name,       col1X + 90,  infoY + 12)
  doc.text(className,          col1X + 90,  infoY + 28)
  doc.text(academicYear,       col1X + 90,  infoY + 44)
  doc.text(exam.name,          col1X + 90,  infoY + 60)
  doc.text(student.roll_no || '—', col2X + 70, infoY + 12)
  doc.text(section,            col2X + 70,  infoY + 28)

  // ── Marks table ─────────────────────────────────────────────────────
  const tableTop  = infoY + 95
  const rowHeight = 22
  const cols      = {
    subject: { x: 50,  w: 160 },
    max:     { x: 210, w: 60  },
    marks:   { x: 270, w: 70  },
    pct:     { x: 340, w: 65  },
    grade:   { x: 405, w: 45  },
    gpa:     { x: 450, w: 40  },
    remark:  { x: 490, w: 55  },
  }

  // Table header
  doc.rect(50, tableTop, W, rowHeight).fill(PRIMARY)
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
  const headers = [
    ['Subject',    cols.subject.x + 4],
    ['Max',        cols.max.x + 4],
    ['Obtained',   cols.marks.x + 4],
    ['%',          cols.pct.x + 4],
    ['Grade',      cols.grade.x + 4],
    ['GPA',        cols.gpa.x + 4],
    ['Remark',     cols.remark.x + 4],
  ]
  headers.forEach(([label, x]) => {
    doc.text(label, x, tableTop + 7, { width: 55 })
  })

  // Table rows
  result.subjects.forEach((sub, i) => {
    const y      = tableTop + rowHeight + i * rowHeight
    const isEven = i % 2 === 0
    const isFail = sub.percentage < 40 && !sub.is_absent

    doc.rect(50, y, W, rowHeight)
       .fill(isFail ? '#fef2f2' : isEven ? LIGHT : 'white')

    doc.fillColor(isFail ? RED : DARK)
       .fontSize(9).font('Helvetica')

    doc.text(sub.subject_name,                  cols.subject.x + 4, y + 7, { width: 150 })
    doc.text(String(sub.max_marks),             cols.max.x + 4,     y + 7)
    doc.text(sub.is_absent ? 'AB' : String(sub.marks_obtained), cols.marks.x + 4, y + 7)
    doc.text(sub.is_absent ? '—'  : `${sub.percentage}%`,       cols.pct.x + 4,   y + 7)
    doc.text(sub.letter_grade,                  cols.grade.x + 4,  y + 7)
    doc.text(String(sub.gpa),                   cols.gpa.x + 4,    y + 7)
    doc.text(sub.remark,                        cols.remark.x + 4, y + 7, { width: 55 })
  })

  // Table border
  const tableBottom = tableTop + rowHeight + result.subjects.length * rowHeight
  doc.rect(50, tableTop, W, tableBottom - tableTop).stroke('#e2e8f0')

  // ── Result summary box ──────────────────────────────────────────────
  const summaryY = tableBottom + 15
  doc.rect(50, summaryY, W, 65).fill(LIGHT).stroke('#e2e8f0')

  const isPASS = result.result === 'PASS'
  const s1X = 65, s2X = 200, s3X = 320, s4X = 420

  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
  doc.text('Total Marks:',  s1X, summaryY + 12)
  doc.text('Percentage:',   s2X, summaryY + 12)
  doc.text('Overall GPA:',  s3X, summaryY + 12)
  doc.text('Result:',       s4X, summaryY + 12)

  doc.font('Helvetica').fillColor(GRAY)
  doc.text(`${result.total_obtained} / ${result.total_max}`, s1X, summaryY + 28)
  doc.text(`${result.percentage}%`,                          s2X, summaryY + 28)
  doc.text(`${result.gpa} / 4.0`,                           s3X, summaryY + 28)

  doc.fontSize(13).font('Helvetica-Bold')
     .fillColor(isPASS ? GREEN : RED)
     .text(result.result, s4X, summaryY + 25)

  // Grade + Remark
  doc.fontSize(9).font('Helvetica').fillColor(GRAY)
  doc.text(`Grade: ${result.letter_grade}  |  ${result.remark}`,
    50, summaryY + 50, { width: W, align: 'center' })

  // ── Rank (if provided) ──────────────────────────────────────────────
  if (data.rank) {
    doc.fontSize(9).fillColor(GRAY)
       .text(`Class Rank: ${data.rank} out of ${data.total_students}`,
         50, summaryY + 80, { width: W, align: 'center' })
  }

  // ── Footer ──────────────────────────────────────────────────────────
  const footerY = 760
  doc.rect(50, footerY, W, 0.5).fill('#e2e8f0')
  doc.fontSize(8).fillColor(GRAY)
     .text(
       `Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}   |   School Management System`,
       50, footerY + 8, { width: W, align: 'center' }
     )

  doc.end()
}

module.exports = { generateReportCardPDF }