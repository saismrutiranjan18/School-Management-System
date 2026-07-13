import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchExams } from '../../api/exams.api'
import { fetchMarksSheet, enterMarks } from '../../api/marks.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { CheckCircle2, AlertCircle, Send, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EnterMarks() {
  const [classId, setClassId]     = useState('')
  const [examId, setExamId]       = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [records, setRecords]     = useState([])
  const [submitted, setSubmitted] = useState(false)

  const { data: classes = [] }  = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: exams = [] }    = useQuery({ queryKey: ['exams', classId], queryFn: () => fetchExams(classId), enabled: !!classId })
  const { data: subjects = [] } = useQuery({ queryKey: ['class-subjects', classId], queryFn: () => api.get(`/classes/${classId}/subjects`).then(r => r.data), enabled: !!classId })

  const { isLoading: sheetLoading } = useQuery({
    queryKey: ['marks-sheet', examId, subjectId],
    queryFn: async () => {
      const data = await fetchMarksSheet(examId, subjectId)
      setRecords(data.students.map(s => ({
        student_id: s.student_id, name: s.name, roll_no: s.roll_no,
        marks_obtained: s.marks_obtained, max_marks: s.max_marks, is_absent: s.is_absent, remarks: s.remarks,
      })))
      setSubmitted(data.is_entered)
      return data
    },
    enabled: !!(examId && subjectId),
  })

  const mutation = useMutation({ mutationFn: enterMarks, onSuccess: () => setSubmitted(true) })

  const update = (index, field, value) => setRecords(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))

  const handleSubmit = () => {
    mutation.mutate({
      exam_id: parseInt(examId), subject_id: parseInt(subjectId),
      records: records.map(({ student_id, marks_obtained, max_marks, is_absent, remarks }) => ({
        student_id, marks_obtained: is_absent ? 0 : parseFloat(marks_obtained) || 0,
        max_marks: parseFloat(max_marks) || 100, is_absent, remarks,
      })),
    })
  }

  const getGradeColor = (obtained, max, absent) => {
    if (absent) return 'text-slate-400 dark:text-slate-500'
    const pct = (parseFloat(obtained) / parseFloat(max)) * 100
    if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
    if (pct >= 40) return 'text-orange-500 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <DashboardLayout title="Enter Marks">
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Enter Marks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select exam, class, and subject to enter marks</p>
        </div>

        {/* Selectors */}
        <Card className="grid grid-cols-3 gap-4">
          <Select label="Class" value={classId} onChange={e => { setClassId(e.target.value); setExamId(''); setSubjectId('') }}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Select label="Exam" value={examId} onChange={e => setExamId(e.target.value)} disabled={!classId}>
            <option value="">Select exam…</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Select label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classId}>
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Card>

        {examId && subjectId && (
          sheetLoading ? (
            <Card><p className="text-sm text-slate-400 text-center py-8">Loading students…</p></Card>
          ) : records.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <FileText size={32} className="opacity-30" /><p className="text-sm">No students in this class.</p>
              </div>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {submitted && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl">
                  <CheckCircle2 size={15} className="shrink-0" /> Marks already entered. You can update them below.
                </div>
              )}

              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3 w-16">Roll</th>
                        <th className="text-left px-5 py-3">Student</th>
                        <th className="text-center px-4 py-3 w-28">Max Marks</th>
                        <th className="text-center px-4 py-3 w-28">Marks Obtained</th>
                        <th className="text-center px-4 py-3 w-20">Absent</th>
                        <th className="text-center px-4 py-3 w-16">%</th>
                        <th className="text-left px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {records.map((student, i) => {
                        const pct = student.is_absent ? null : student.marks_obtained !== '' ? ((parseFloat(student.marks_obtained) / parseFloat(student.max_marks)) * 100).toFixed(1) : null
                        return (
                          <tr key={student.student_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${student.is_absent ? 'opacity-60' : ''}`}>
                            <td className="px-5 py-3 text-slate-400 text-xs">{student.roll_no || '—'}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {student.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{student.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input type="number" min="0" max="1000" value={student.max_marks}
                                onChange={e => update(i, 'max_marks', e.target.value)} disabled={student.is_absent}
                                className="w-20 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-40 transition-all" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input type="number" min="0" max={student.max_marks} value={student.marks_obtained}
                                onChange={e => update(i, 'marks_obtained', e.target.value)} disabled={student.is_absent}
                                className="w-24 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-40 transition-all" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input type="checkbox" checked={student.is_absent} onChange={e => update(i, 'is_absent', e.target.checked)}
                                className="w-4 h-4 accent-red-500 rounded" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {student.is_absent ? (
                                <span className="text-xs text-slate-400">AB</span>
                              ) : pct !== null ? (
                                <span className={`text-xs font-bold ${getGradeColor(student.marks_obtained, student.max_marks, false)}`}>{pct}%</span>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input value={student.remarks} onChange={e => update(i, 'remarks', e.target.value)} placeholder="Optional…"
                                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all" />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex items-center gap-4">
                <Button leftIcon={<Send size={14} />} loading={mutation.isPending} onClick={handleSubmit}>
                  {submitted ? 'Update Marks' : 'Submit Marks'}
                </Button>
                {mutation.isSuccess && <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> Marks saved!</span>}
                {mutation.isError && <span className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} /> {mutation.error?.response?.data?.error || 'Failed to save.'}</span>}
              </div>
            </motion.div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}