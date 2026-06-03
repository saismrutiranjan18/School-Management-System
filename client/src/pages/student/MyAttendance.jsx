import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentAttendance } from '../../api/attendance.api'
import api from '../../api/axios'

export default function MyAttendance() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r =>
      r.data.find(s => s.email === user?.email)
    ),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance', studentRecord?.id],
    queryFn: () => fetchStudentAttendance(studentRecord.id),
    enabled: !!studentRecord?.id,
  })

  const getBarColor = (pct) => {
    const n = parseFloat(pct)
    if (n >= 75) return 'bg-green-500'
    if (n >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColor = (pct) => {
    const n = parseFloat(pct)
    if (n >= 75) return 'text-green-600'
    if (n >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm">Loading attendance...</p>
  )

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Subject-wise attendance summary</p>
      </div>

      {/* Subject-wise summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {data?.summary?.length === 0 && (
          <p className="text-gray-400 text-sm col-span-2">No attendance records yet.</p>
        )}
        {data?.summary?.map(sub => (
          <div key={sub.subject_id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{sub.subject_name}</p>
                <p className="text-xs text-gray-400">{sub.subject_code}</p>
              </div>
              <span className={`text-2xl font-bold ${getTextColor(sub.attendance_percentage)}`}>
                {sub.attendance_percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all ${getBarColor(sub.attendance_percentage)}`}
                style={{ width: `${Math.min(sub.attendance_percentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Present: <strong className="text-green-600">{sub.present_count}</strong></span>
              <span>Absent: <strong className="text-red-500">{sub.absent_count}</strong></span>
              <span>Late: <strong className="text-yellow-600">{sub.late_count}</strong></span>
              <span>Total: <strong>{sub.total_classes}</strong></span>
            </div>

            {parseFloat(sub.attendance_percentage) < 75 && (
              <p className="mt-2 text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                ⚠️ Below 75% — attendance shortage
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recent records */}
      {data?.details?.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Recent Records</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Subject</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.details.map((rec, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(rec.date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                        {rec.subject_code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${rec.status === 'present' ? 'bg-green-100 text-green-700' : ''}
                        ${rec.status === 'absent'  ? 'bg-red-100   text-red-700'   : ''}
                        ${rec.status === 'late'    ? 'bg-yellow-100 text-yellow-700' : ''}
                      `}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {rec.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}