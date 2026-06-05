import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchClassAttendanceReport } from '../../api/attendance.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'

export default function AttendanceReport() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [classId,   setClassId]   = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [from,      setFrom]      = useState(monthStart)
  const [to,        setTo]        = useState(today)

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => api.get(`/classes/${classId}/subjects`).then(r => r.data),
    enabled: !!classId,
  })

  const { data: report = [], isLoading } = useQuery({
    queryKey: ['attendance-report', classId, subjectId, from, to],
    queryFn: () => fetchClassAttendanceReport(classId, {
      subject_id: subjectId || undefined,
      from,
      to,
    }),
    enabled: !!classId,
  })

  const getPercentageColor = (pct) => {
    const n = parseFloat(pct)
    if (n >= 75) return 'text-green-600'
    if (n >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <DashboardLayout title="Attendance Report">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Attendance Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Subject-wise attendance summary by student</p>
        </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
          <select
            value={classId}
            onChange={e => { setClassId(e.target.value); setSubjectId('') }}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            disabled={!classId}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
          <input
            type="date" value={from}
            onChange={e => setFrom(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
          <input
            type="date" value={to}
            onChange={e => setTo(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {!classId ? (
        <p className="text-gray-400 text-sm text-center py-16">Select a class to view the report.</p>
      ) : isLoading ? (
        <p className="text-gray-400 text-sm text-center py-16">Generating report...</p>
      ) : report.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No attendance records found for this selection.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
            <tbody className="divide-y divide-gray-100">
              {report.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{row.student_name}</p>
                    <p className="text-xs text-gray-400">Roll: {row.roll_no || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                      {row.subject_code}
                    </span>
                    <span className="ml-2 text-gray-600">{row.subject_name}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.total_classes}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{row.present}</td>
                  <td className="px-4 py-3 text-center text-red-500 font-medium">{row.absent}</td>
                  <td className="px-4 py-3 text-center text-yellow-600 font-medium">{row.late}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold text-sm ${getPercentageColor(row.percentage)}`}>
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
  </DashboardLayout>
)
}