import { useSelector }   from 'react-redux'
import { useQuery }      from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout   from '../../components/DashboardLayout'

const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  clipboard:  ['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2'],
  checkmark:  ['M20 6 9 17l-5-5'],
  absent:     ['M18 6 6 18','M6 6l12 12'],
  marked:     ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  classes:    ['M22 10v6M2 10l10-5 10 5-10 5z','M6 12v5c3 3 9 3 12 0v-5'],
  notice:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  user:       ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
}

const PRIORITY_BADGE = {
  urgent: 'bg-red-100    text-red-700',
  high:   'bg-orange-100 text-orange-700',
  normal: 'bg-blue-50    text-blue-600',
  low:    'bg-gray-100   text-gray-500',
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
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </DashboardLayout>
  )

  const classes = data?.my_classes       || []
  const today   = data?.today_attendance || {}
  const notices = data?.announcements    || []

  const stats = [
    {
      label:   "Today's Marked",
      value:   today.total_marked || 0,
      color:   'text-gray-800',
      bg:      'bg-gray-100 text-gray-600',
      iconKey: 'marked',
    },
    {
      label:   'Present',
      value:   today.present || 0,
      color:   'text-green-600',
      bg:      'bg-green-100 text-green-600',
      iconKey: 'checkmark',
    },
    {
      label:   'Absent',
      value:   today.absent || 0,
      color:   'text-red-500',
      bg:      'bg-red-100 text-red-500',
      iconKey: 'absent',
    },
  ]

  return (
    <DashboardLayout title="My Dashboard">
      <div className="p-6 space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Icon d={ICONS.user} size={18} className="text-white" />
            </div>
            <p className="text-sm font-medium opacity-80">Welcome back</p>
          </div>
          <p className="text-2xl font-bold">{user?.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            You teach {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Today's attendance summary */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                <Icon d={ICONS[s.iconKey]} size={17} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My classes */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Icon d={ICONS.classes} size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">My Classes</p>
          </div>
          <div className="divide-y divide-gray-50">
            {classes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No classes assigned.
              </p>
            ) : (
              classes.map(cls => (
                <div key={cls.id}
                  className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center
                                    justify-center text-sm font-bold text-blue-700">
                      {cls.name.replace('Class ', '')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {cls.name} — {cls.section}
                      </p>
                      <p className="text-xs text-gray-400">
                        {cls.student_count} students
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center
                                  justify-center text-gray-400">
                    <Icon d={ICONS.classes} size={12} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Icon d={ICONS.notice} size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Recent Notices</p>
          </div>
          <div className="divide-y divide-gray-50">
            {notices.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No announcements.
              </p>
            ) : (
              notices.map(n => (
                <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                   capitalize shrink-0 mt-0.5 ${PRIORITY_BADGE[n.priority]}`}>
                    {n.priority}
                  </span>
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