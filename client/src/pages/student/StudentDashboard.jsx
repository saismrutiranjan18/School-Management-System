import { useQuery }      from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout   from '../../components/DashboardLayout'
import { useSelector }   from 'react-redux'

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
  user:       ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
}

export default function StudentDashboard() {
  const { user }   = useSelector(state => state.auth)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  if (isLoading) return (
    <DashboardLayout title="My Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    </DashboardLayout>
  )

  const student = data?.student       || {}
  const att     = data?.attendance    || {}
  const marks   = data?.recent_marks  || []
  const fees    = data?.fee_status    || {}
  const notices = data?.announcements || []

  const attPct   = parseFloat(att.percentage || 0)
  const attColor = attPct >= 75 ? 'text-green-600' : attPct >= 50 ? 'text-yellow-600' : 'text-red-500'
  const barColor = attPct >= 75 ? 'bg-green-500'  : attPct >= 50 ? 'bg-yellow-500'  : 'bg-red-500'

  return (
    <DashboardLayout title="My Dashboard">
      <div className="p-6 space-y-6">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Icon d={ICONS.user} size={18} className="text-white" />
            </div>
            <p className="text-sm opacity-80">Welcome back</p>
          </div>
          <p className="text-2xl font-bold">{user?.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            {student.class_name} — {student.section}
          </p>
        </div>

        {/* Attendance card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg
                              flex items-center justify-center">
                <Icon d={ICONS.attendance} size={16} />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Attendance (Last 30 Days)
              </p>
            </div>
            <span className={`text-2xl font-bold ${attColor}`}>
              {att.percentage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(attPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Present: {att.attended || 0}</span>
            <span>Total: {att.total || 0}</span>
          </div>
          {attPct < 75 && (
            <div className="flex items-center gap-2 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
              <Icon d={ICONS.warning} size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-500">
                Attendance below 75%. Please attend regularly.
              </p>
            </div>
          )}
        </div>

        {/* Recent exam results */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Icon d={ICONS.results} size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Recent Exam Results</p>
          </div>
          {marks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              No results published yet.
            </p>
          ) : (
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
          )}
        </div>

        {/* Fee status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon d={ICONS.fees} size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Fee Status</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600">Paid</p>
              <p className="text-xl font-bold text-green-700">
                ₹{parseFloat(fees.paid || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className={`rounded-xl p-3 text-center
              ${parseFloat(fees.balance || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500">Balance</p>
              <p className={`text-xl font-bold
                ${parseFloat(fees.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{parseFloat(fees.balance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Icon d={ICONS.notice} size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Latest Notices</p>
          </div>
          {notices.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No notices.</p>
          ) : (
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
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}