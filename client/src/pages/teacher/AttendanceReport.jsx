import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchClassAttendanceReport } from '../../api/attendance.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import { Select, Input } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { BarChart3, ClipboardList } from 'lucide-react'

export default function AttendanceReport() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [classId, setClassId]     = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [from, setFrom]           = useState(monthStart)
  const [to, setTo]               = useState(today)

  const { data: classes = [] }  = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: subjects = [] } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => api.get(`/classes/${classId}/subjects`).then(r => r.data),
    enabled: !!classId,
  })

  const { data: report = [], isLoading } = useQuery({
    queryKey: ['attendance-report', classId, subjectId, from, to],
    queryFn: () => fetchClassAttendanceReport(classId, { subject_id: subjectId || undefined, from, to }),
    enabled: !!classId,
  })

  const getPercentageColor = (pct) => {
    const n = parseFloat(pct)
    if (n >= 75) return 'text-emerald-600 dark:text-emerald-400'
    if (n >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getPercentageBg = (pct) => {
    const n = parseFloat(pct)
    if (n >= 75) return 'bg-emerald-50 dark:bg-emerald-900/20'
    if (n >= 50) return 'bg-amber-50 dark:bg-amber-900/20'
    return 'bg-red-50 dark:bg-red-900/20'
  }

  return (
    <DashboardLayout title="Attendance Report">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Attendance Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Subject-wise attendance summary by student</p>
        </div>

        {/* Filters */}
        <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Select label="Class" value={classId} onChange={e => { setClassId(e.target.value); setSubjectId('') }}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Select label="Subject" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classId}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input label="To"   type="date" value={to}   onChange={e => setTo(e.target.value)} />
        </Card>

        {/* Report */}
        {!classId ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <BarChart3 size={40} className="opacity-30" />
              <p className="text-sm">Select a class to view the report</p>
            </div>
          </Card>
        ) : isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Generating report…</p></Card>
        ) : report.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <ClipboardList size={40} className="opacity-30" />
              <p className="text-sm">No attendance records found</p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Subject</th>
                    <th className="text-center px-4 py-3">Total</th>
                    <th className="text-center px-4 py-3">Present</th>
                    <th className="text-center px-4 py-3">Absent</th>
                    <th className="text-center px-4 py-3">Late</th>
                    <th className="text-center px-4 py-3">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {report.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {row.student_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{row.student_name}</p>
                            <p className="text-xs text-slate-400">Roll: {row.roll_no || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="purple">{row.subject_code}</Badge>
                        <span className="ml-2 text-slate-600 dark:text-slate-300">{row.subject_name}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{row.total_classes}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">{row.present}</td>
                      <td className="px-4 py-3 text-center text-red-500 dark:text-red-400 font-medium">{row.absent}</td>
                      <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-medium">{row.late}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${getPercentageColor(row.percentage)} ${getPercentageBg(row.percentage)}`}>
                          {row.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}