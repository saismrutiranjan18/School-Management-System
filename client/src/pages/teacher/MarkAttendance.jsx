import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchAttendanceSheet, markAttendance } from '../../api/attendance.api'
import api from '../../api/axios'
import { useSelector } from 'react-redux'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import { Select, Input } from '../../components/ui/Input'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import { CheckCircle2, XCircle, Clock, Users, AlertCircle, Send } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_STYLES = {
  present: { bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700', active: true },
  absent:  { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700', active: true },
  late:    { bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700', active: true },
}
const STATUS_OPTIONS = ['present', 'absent', 'late']

export default function MarkAttendance() {
  const { user } = useSelector(state => state.auth)
  const today = new Date().toISOString().split('T')[0]

  const [classId,   setClassId]   = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date,      setDate]      = useState(today)
  const [records,   setRecords]   = useState([])
  const [submitted, setSubmitted] = useState(false)

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: subjects = [] } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => api.get(`/classes/${classId}/subjects`).then(r => r.data),
    enabled: !!classId,
  })
  const { data: teacherRecord } = useQuery({
    queryKey: ['my-teacher-record', user?.id],
    queryFn: () => api.get('/teachers').then(r => r.data.find(t => t.email === user?.email)),
    enabled: !!user,
  })

  const { isLoading: sheetLoading } = useQuery({
    queryKey: ['attendance-sheet', classId, subjectId, date],
    queryFn: async () => {
      const data = await fetchAttendanceSheet(classId, subjectId, date)
      setRecords(data.students.map(s => ({
        student_id: s.student_id, name: s.name, roll_no: s.roll_no, status: s.status, remarks: s.remarks,
      })))
      setSubmitted(data.is_marked)
      return data
    },
    enabled: !!(classId && subjectId && date),
  })

  const mutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => setSubmitted(true),
  })

  const setStatus = (index, status) => setRecords(prev => prev.map((r, i) => i === index ? { ...r, status } : r))
  const markAll   = (status) => setRecords(prev => prev.map(r => ({ ...r, status })))

  const handleSubmit = () => {
    if (!teacherRecord) return
    mutation.mutate({
      class_id: parseInt(classId), subject_id: parseInt(subjectId), teacher_id: teacherRecord.id, date,
      records: records.map(({ student_id, status, remarks }) => ({ student_id, status, remarks })),
    })
  }

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount  = records.filter(r => r.status === 'absent').length
  const lateCount    = records.filter(r => r.status === 'late').length

  return (
    <DashboardLayout title="Mark Attendance">
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Mark Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select class, subject, and date to begin</p>
        </div>

        {/* Filters */}
        <Card className="grid grid-cols-3 gap-4">
          <Select label="Class" value={classId} onChange={e => { setClassId(e.target.value); setSubjectId('') }}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Select label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classId}>
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Date" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
        </Card>

        {/* Attendance sheet */}
        {classId && subjectId && date && (
          sheetLoading ? (
            <Card><p className="text-sm text-slate-400 text-center py-8">Loading students…</p></Card>
          ) : records.length === 0 ? (
            <Card><p className="text-sm text-slate-400 text-center py-8">No students found in this class.</p></Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Present', count: presentCount, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
                  { label: 'Absent',  count: absentCount,  icon: XCircle,      gradient: 'from-red-400 to-rose-600'     },
                  { label: 'Late',    count: lateCount,    icon: Clock,        gradient: 'from-amber-400 to-orange-500' },
                ].map((s, i) => (
                  <Card key={i} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                      <s.icon size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mark all */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => markAll(s)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium capitalize transition-all ${STATUS_STYLES[s].bg}`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Already marked banner */}
              {submitted && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl">
                  <CheckCircle2 size={15} className="shrink-0" />
                  Attendance already marked. You can still update it.
                </div>
              )}

              {/* Student list */}
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3 w-16">Roll</th>
                        <th className="text-left px-5 py-3">Student Name</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-left px-5 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {records.map((student, index) => (
                        <tr key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 text-slate-400 text-xs">{student.roll_no || '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {student.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-800 dark:text-slate-100">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              {STATUS_OPTIONS.map(s => (
                                <button key={s} onClick={() => setStatus(index, s)}
                                  className={`px-3 py-1 text-xs rounded-full border font-medium capitalize transition-all
                                    ${student.status === s ? STATUS_STYLES[s].bg : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <input value={student.remarks}
                              onChange={e => setRecords(prev => prev.map((r, i) => i === index ? { ...r, remarks: e.target.value } : r))}
                              placeholder="Optional note…"
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <Button leftIcon={<Send size={14} />} loading={mutation.isPending} onClick={handleSubmit}>
                  {submitted ? 'Update Attendance' : 'Submit Attendance'}
                </Button>
                {mutation.isSuccess && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Saved! Absence alerts sent.
                  </span>
                )}
                {mutation.isError && (
                  <span className="text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {mutation.error?.response?.data?.error || 'Failed to save.'}
                  </span>
                )}
              </div>
            </motion.div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}