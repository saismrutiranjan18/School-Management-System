import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchTimetableByTeacher } from '../../api/timetable.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Calendar } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DAY_VARIANT = {
  Monday: 'info', Tuesday: 'purple', Wednesday: 'success',
  Thursday: 'warning', Friday: 'primary', Saturday: 'danger',
}

export default function MyTimetable() {
  const { user } = useSelector(state => state.auth)

  const { data: teacherRecord } = useQuery({
    queryKey: ['my-teacher-record'],
    queryFn: () => api.get('/teachers').then(r => r.data.find(t => t.email === user?.email)),
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

  return (
    <DashboardLayout title="My Timetable">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">My Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your weekly teaching schedule</p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading your timetable…</p></Card>
        ) : periods.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Calendar size={40} className="opacity-30" />
              <p className="text-sm">No timetable configured yet</p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto p-4">
              <table className="w-full border-separate border-spacing-1.5 min-w-[700px]">
                <thead>
                  <tr>
                    <th className="w-20">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Period</span>
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="text-center">
                        <Badge variant={DAY_VARIANT[day]}>{day}</Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period.period_no}>
                      <td className="pr-2 align-middle text-right">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">P{period.period_no}</p>
                        <p className="text-[10px] text-slate-400">{String(period.start_time).slice(0, 5)}</p>
                      </td>
                      {DAYS.map(day => {
                        const entry = timetableMap[`${day}-${period.period_no}`]
                        return (
                          <td key={day}>
                            <div className={`min-h-[68px] rounded-xl p-2.5 text-center transition-all
                              ${entry
                                ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                : 'bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700'}`}>
                              {entry ? (
                                <>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{entry.subject_name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{entry.subject_code}</p>
                                  <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5 font-medium">{entry.class_name} — {entry.section}</p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-300 dark:text-slate-600 mt-5">Free</p>
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
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}