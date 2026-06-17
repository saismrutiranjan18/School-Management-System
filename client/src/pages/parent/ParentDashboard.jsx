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
  attendance: ['M9 11l3 3L22 4','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  fees:       ['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  results:    ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  notice:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  warning:    ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  family:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
}

export default function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  const child = data?.child

  if (isLoading) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </DashboardLayout>
  )

  if (!child || child.error) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 text-center py-16">
        <div className="flex justify-center mb-3 text-gray-300">
          <Icon d={ICONS.family} size={48} />
        </div>
        <p className="text-sm text-gray-500">No child record linked to your account.</p>
        <p className="text-xs text-gray-400 mt-1">
          Contact the school to link your child's profile.
        </p>
      </div>
    </DashboardLayout>
  )

  const student = child.student || {}
  const att     = child.attendance || {}
  const marks   = child.recent_marks || []
  const fees    = child.fee_status || {}
  const notices = child.announcements || []
  const attPct  = parseFloat(att.percentage || 0)

  const quickStats = [
    {
      label:   'Attendance',
      value:   `${att.percentage || 0}%`,
      color:   attPct >= 75 ? 'text-green-600' : 'text-red-500',
      bg:      attPct >= 75 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
      iconKey: 'attendance',
    },
    {
      label:   'Fee Balance',
      value:   `₹${parseFloat(fees.balance || 0).toLocaleString('en-IN')}`,
      color:   parseFloat(fees.balance || 0) > 0 ? 'text-red-500' : 'text-green-600',
      bg:      parseFloat(fees.balance || 0) > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600',
      iconKey: 'fees',
    },
    {
      label:   'Latest Exam',
      value:   marks[0] ? `${marks[0].percentage}%` : 'N/A',
      color:   'text-blue-600',
      bg:      'bg-blue-50 text-blue-600',
      iconKey: 'results',
    },
  ]

  return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 space-y-5">

        {/* Child info banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Icon d={ICONS.family} size={18} className="text-white" />
            </div>
            <p className="text-sm opacity-80">Your Child</p>
          </div>
          <p className="text-2xl font-bold mt-0.5">{student.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            {student.class_name} — {student.section}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map(s => (
            <div key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center
                               justify-center ${s.bg}`}>
                <Icon d={ICONS[s.iconKey]} size={18} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Attendance warning */}
        {attPct < 75 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <Icon d={ICONS.warning} size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Attendance Warning</p>
              <p className="text-xs text-red-600 mt-1">
                {student.name}'s attendance is {att.percentage}%, which is below the required 75%.
                Please ensure regular attendance.
              </p>
            </div>
          </div>
        )}

        {/* Exam results */}
        {marks.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Icon d={ICONS.results} size={15} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">Recent Results</p>
            </div>
            <div className="divide-y divide-gray-50">
              {marks.map((m, i) => {
                const pct   = parseFloat(m.percentage || 0)
                const color = pct >= 75 ? 'text-green-600'
                            : pct >= 50 ? 'text-yellow-600'
                            : 'text-red-500'
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-gray-800">{m.exam_name}</p>
                    <span className={`text-lg font-bold ${color}`}>
                      {m.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notices */}
        {notices.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Icon d={ICONS.notice} size={15} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-700">School Notices</p>
            </div>
            <div className="divide-y divide-gray-50">
              {notices.map(n => (
                <div key={n.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}