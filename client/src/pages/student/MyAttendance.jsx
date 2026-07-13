import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentAttendance } from '../../api/attendance.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'

const getBarColor  = (pct) => parseFloat(pct) >= 75 ? 'bg-emerald-500' : parseFloat(pct) >= 50 ? 'bg-amber-500' : 'bg-red-500'
const getTextColor = (pct) => parseFloat(pct) >= 75 ? 'text-emerald-600 dark:text-emerald-400' : parseFloat(pct) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'

const STATUS_VARIANT = { present: 'success', absent: 'danger', late: 'warning' }

export default function MyAttendance() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance', studentRecord?.id],
    queryFn: () => fetchStudentAttendance(studentRecord.id),
    enabled: !!studentRecord?.id,
  })

  return (
    <DashboardLayout title="My Attendance">
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Subject-wise attendance summary</p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading attendance…</p></Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.summary?.length === 0 && (
                <Card className="col-span-2"><p className="text-sm text-slate-400 text-center py-8">No attendance records yet.</p></Card>
              )}
              {data?.summary?.map(sub => (
                <Card key={sub.subject_id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{sub.subject_name}</p>
                      <p className="text-xs text-slate-400">{sub.subject_code}</p>
                    </div>
                    <span className={`text-2xl font-bold font-display ${getTextColor(sub.attendance_percentage)}`}>
                      {sub.attendance_percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full transition-all duration-500 ${getBarColor(sub.attendance_percentage)}`}
                      style={{ width: `${Math.min(sub.attendance_percentage, 100)}%` }} />
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Present: <strong className="text-emerald-600 dark:text-emerald-400">{sub.present_count}</strong></span>
                    <span>Absent: <strong className="text-red-500 dark:text-red-400">{sub.absent_count}</strong></span>
                    <span>Late: <strong className="text-amber-600 dark:text-amber-400">{sub.late_count}</strong></span>
                    <span>Total: <strong className="text-slate-700 dark:text-slate-300">{sub.total_classes}</strong></span>
                  </div>

                  {parseFloat(sub.attendance_percentage) < 75 && (
                    <div className="flex items-center gap-2 mt-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-800/30">
                      <AlertTriangle size={13} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-500 dark:text-red-400">Below 75% — attendance shortage</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Recent records */}
            {data?.details?.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Records</h2>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-5 py-3">Date</th>
                          <th className="text-left px-5 py-3">Subject</th>
                          <th className="text-left px-5 py-3">Status</th>
                          <th className="text-left px-5 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {data.details.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                              {new Date(rec.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3"><Badge variant="purple">{rec.subject_code}</Badge></td>
                            <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[rec.status] || 'default'}>{rec.status}</Badge></td>
                            <td className="px-5 py-3 text-slate-400 text-xs">{rec.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}