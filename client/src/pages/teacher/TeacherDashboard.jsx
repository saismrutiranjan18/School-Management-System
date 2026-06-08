import { useSelector }   from 'react-redux'
import { useQuery }      from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout   from '../../components/DashboardLayout'

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-blue-50 text-blue-600',
  low:    'bg-gray-100 text-gray-500',
}

export default function TeacherDashboard() {
  const { user }   = useSelector(state => state.auth)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </DashboardLayout>
  )

  const classes   = data?.my_classes       || []
  const today     = data?.today_attendance || {}
  const notices   = data?.announcements    || []

  return (
    <DashboardLayout title="My Dashboard">
      <div className="p-6 space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-sm font-medium opacity-80">Welcome back 👋</p>
          <p className="text-2xl font-bold mt-1">{user?.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            You teach {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Today's attendance summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Today's Marked", value: today.total_marked || 0, color: 'text-gray-800', icon: '📋' },
            { label: 'Present',        value: today.present       || 0, color: 'text-green-600', icon: '✅' },
            { label: 'Absent',         value: today.absent        || 0, color: 'text-red-500',   icon: '❌' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My classes */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">My Classes</p>
          </div>
          <div className="divide-y divide-gray-50">
            {classes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No classes assigned.</p>
            ) : (
              classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-sm font-bold text-blue-700">
                      {cls.name.replace('Class ', '')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cls.name} — {cls.section}</p>
                      <p className="text-xs text-gray-400">{cls.student_count} students</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Recent Notices</p>
          </div>
          <div className="divide-y divide-gray-50">
            {notices.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No announcements.</p>
            ) : (
              notices.map(n => (
                <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 mt-0.5 ${PRIORITY_BADGE[n.priority]}`}>
                    {n.priority}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}