import { useQuery }      from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout   from '../../components/DashboardLayout'

export default function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  const child = data?.child

  if (isLoading) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </DashboardLayout>
  )

  if (!child || child.error) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 text-center py-16">
        <p className="text-4xl mb-3">👨‍👩‍👧</p>
        <p className="text-sm text-gray-500">No child record linked to your account.</p>
        <p className="text-xs text-gray-400 mt-1">Contact the school to link your child's profile.</p>
      </div>
    </DashboardLayout>
  )

  const student = child.student || {}
  const att     = child.attendance || {}
  const marks   = child.recent_marks || []
  const fees    = child.fee_status || {}
  const notices = child.announcements || []
  const attPct  = parseFloat(att.percentage || 0)

  return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 space-y-5">

        {/* Child info banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">Your Child</p>
          <p className="text-2xl font-bold mt-1">{student.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            {student.class_name} — {student.section}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label:   'Attendance',
              value:   `${att.percentage || 0}%`,
              color:   attPct >= 75 ? 'text-green-600' : 'text-red-500',
              icon:    '📊',
            },
            {
              label:   'Fee Balance',
              value:   `₹${parseFloat(fees.balance || 0).toLocaleString('en-IN')}`,
              color:   parseFloat(fees.balance || 0) > 0 ? 'text-red-500' : 'text-green-600',
              icon:    '💰',
            },
            {
              label:   'Latest Exam',
              value:   marks[0] ? `${marks[0].percentage}%` : 'N/A',
              color:   'text-blue-600',
              icon:    '📝',
            },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Attendance warning */}
        {attPct < 75 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-red-700">⚠️ Attendance Warning</p>
            <p className="text-xs text-red-600 mt-1">
              {student.name}'s attendance is {att.percentage}%, which is below the required 75%.
              Please ensure regular attendance.
            </p>
          </div>
        )}

        {/* Exam results */}
        {marks.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Recent Results</p>
            </div>
            <div className="divide-y divide-gray-50">
              {marks.map((m, i) => {
                const pct   = parseFloat(m.percentage || 0)
                const color = pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-gray-800">{m.exam_name}</p>
                    <span className={`text-lg font-bold ${color}`}>{m.percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notices */}
        {notices.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
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