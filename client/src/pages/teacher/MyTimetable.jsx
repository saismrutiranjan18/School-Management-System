import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchTimetableByTeacher } from '../../api/timetable.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DAY_COLORS = {
  Monday:    'bg-blue-50 text-blue-700',
  Tuesday:   'bg-purple-50 text-purple-700',
  Wednesday: 'bg-green-50 text-green-700',
  Thursday:  'bg-yellow-50 text-yellow-700',
  Friday:    'bg-pink-50 text-pink-700',
  Saturday:  'bg-orange-50 text-orange-700',
}

export default function MyTimetable() {
  const { user } = useSelector(state => state.auth)

  // Get teacher record for logged-in user
  const { data: teacherRecord } = useQuery({
    queryKey: ['my-teacher-record'],
    queryFn: () => api.get('/teachers').then(r =>
      r.data.find(t => t.email === user?.email)
    ),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-timetable', teacherRecord?.id],
    queryFn: () => fetchTimetableByTeacher(teacherRecord.id),
    enabled: !!teacherRecord?.id,
  })

  const timetableMap = {}
  data?.timetable?.forEach(entry => {
    timetableMap[`${entry.day}-${entry.period_no}`] = entry
  })

  const periods = data?.periods || []

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm">Loading your timetable...</p>
  )

  return (
    <DashboardLayout title="My Timetable">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">My Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your weekly teaching schedule</p>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 min-w-[700px]">
          <thead>
            <tr>
              <th className="w-20">
                <span className="text-xs text-gray-400 font-medium">Period</span>
              </th>
              {DAYS.map(day => (
                <th key={day} className="text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${DAY_COLORS[day]}`}>
                    {day}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.period_no}>
                <td className="pr-2 align-middle text-right">
                  <p className="text-xs font-semibold text-gray-700">P{period.period_no}</p>
                  <p className="text-xs text-gray-400">{String(period.start_time).slice(0, 5)}</p>
                </td>
                {DAYS.map(day => {
                  const entry = timetableMap[`${day}-${period.period_no}`]
                  return (
                    <td key={day}>
                      <div className={`
                        min-h-[64px] rounded-lg p-2 text-center
                        ${entry
                          ? 'bg-white border border-gray-200 shadow-sm'
                          : 'bg-gray-50 border border-dashed border-gray-200'}
                      `}>
                        {entry ? (
                          <>
                            <p className="text-xs font-semibold text-gray-800">{entry.subject_name}</p>
                            <p className="text-xs text-gray-400">{entry.subject_code}</p>
                            <p className="text-xs text-blue-500 mt-0.5">{entry.class_name} - {entry.section}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-300 mt-4">Free</p>
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
  </DashboardLayout>
)
}