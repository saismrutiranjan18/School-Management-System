// ── Letter Grade ───────────────────────────────────────────────────────
const getLetterGrade = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

// ── GPA (4.0 scale) ───────────────────────────────────────────────────
const getGPA = (percentage) => {
  if (percentage >= 90) return 4.0
  if (percentage >= 80) return 3.7
  if (percentage >= 70) return 3.3
  if (percentage >= 60) return 3.0
  if (percentage >= 50) return 2.0
  if (percentage >= 40) return 1.0
  return 0.0
}

// ── Grade remark ──────────────────────────────────────────────────────
const getRemark = (percentage) => {
  if (percentage >= 90) return 'Outstanding'
  if (percentage >= 80) return 'Excellent'
  if (percentage >= 70) return 'Very Good'
  if (percentage >= 60) return 'Good'
  if (percentage >= 50) return 'Average'
  if (percentage >= 40) return 'Below Average'
  return 'Fail'
}

// ── Calculate full result for a student ──────────────────────────────
// subjectMarks = [{ subject_name, marks_obtained, max_marks, is_absent }]
const calculateResult = (subjectMarks) => {
  const valid = subjectMarks.filter(m => !m.is_absent)

  const totalObtained = valid.reduce((sum, m) => sum + parseFloat(m.marks_obtained), 0)
  const totalMax      = subjectMarks.reduce((sum, m) => sum + parseFloat(m.max_marks), 0)
  const percentage    = totalMax > 0
    ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2))
    : 0

  const hasFail   = valid.some(m =>
    (parseFloat(m.marks_obtained) / parseFloat(m.max_marks)) * 100 < 40
  )
  const hasAbsent = subjectMarks.some(m => m.is_absent)

  // Enrich each subject with grade
  const subjects = subjectMarks.map(m => {
    const pct = m.is_absent
      ? 0
      : parseFloat(((parseFloat(m.marks_obtained) / parseFloat(m.max_marks)) * 100).toFixed(2))
    return {
      ...m,
      percentage:   pct,
      letter_grade: m.is_absent ? 'AB' : getLetterGrade(pct),
      gpa:          m.is_absent ? 0    : getGPA(pct),
      remark:       m.is_absent ? 'Absent' : getRemark(pct),
    }
  })

  // Overall GPA = average of subject GPAs (excluding absent)
  const gpaSum     = valid.reduce((sum, m) => {
    const pct = (parseFloat(m.marks_obtained) / parseFloat(m.max_marks)) * 100
    return sum + getGPA(pct)
  }, 0)
  const overallGPA = valid.length > 0
    ? parseFloat((gpaSum / valid.length).toFixed(2))
    : 0

  return {
    subjects,
    total_obtained: parseFloat(totalObtained.toFixed(2)),
    total_max:      parseFloat(totalMax.toFixed(2)),
    percentage,
    letter_grade:   getLetterGrade(percentage),
    gpa:            overallGPA,
    remark:         getRemark(percentage),
    result:         hasFail || hasAbsent ? 'FAIL' : 'PASS',
  }
}

module.exports = { getLetterGrade, getGPA, getRemark, calculateResult }