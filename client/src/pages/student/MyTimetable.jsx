import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchTimetableByClass } from '../../api/timetable.api'
import api from '../../api/axios'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentTimetable() {
  const { user } = useSelector(state => state.auth)

  // Get student record to find class_id
  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record'],
    queryFn: () => api.get(`/students`).then(r =>
      r.data.find(s => s.email === user?.email)
    ),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['student-timetable', studentRecord?.class_id],
    queryFn: () => fetchTimetableByClass(studentRecord.class_id),
    enabled: !!studentRecord?.class_id,
  })

  const timetableMap = {}
  data?.timetable?.forEach(entry => {
    timetableMap[`${entry.day}-${entry.period_no}`] = entry
  })

  const periods = data?.periods || []

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm">Loading timetable...</p>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Timetable</h1>
        <p className="text-sm text-gray-500">Your class weekly schedule</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 min-w-[700px]">
          <thead>
            <tr>
              <th className="w-20 text-xs text-gray-400 font-medium text-right pr-2">Period</th>
              {DAYS.map(day => (
                <th key={day} className="text-center text-xs font-semibold text-gray-600 pb-2">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.period_no}>
                <td className="pr-2 text-right align-middle">
                  <p className="text-xs font-semibold text-gray-600">P{period.period_no}</p>
                  <p className="text-xs text-gray-400">{String(period.start_time).slice(0, 5)}</p>
                </td>
                {DAYS.map(day => {
                  const entry = timetableMap[`${day}-${period.period_no}`]
                  return (
                    <td key={day}>
                      <div className={`
                        min-h-[60px] rounded-lg p-2 text-center
                        ${entry
                          ? 'bg-white border border-gray-200'
                          : 'bg-gray-50 border border-dashed border-gray-100'}
                      `}>
                        {entry ? (
                          <>
                            <p className="text-xs font-semibold text-gray-800">{entry.subject_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{entry.teacher_name}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-200 mt-4">—</p>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}