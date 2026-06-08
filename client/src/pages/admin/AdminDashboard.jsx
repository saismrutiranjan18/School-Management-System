import { useQuery }  from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout   from '../../components/DashboardLayout'
import {
  BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'

const TYPE_COLORS = {
  holiday: '#dc2626', exam: '#7c3aed', ptm: '#2563eb',
  sports: '#16a34a', cultural: '#d97706', meeting: '#0891b2', general: '#64748b',
}

const fmt = (v) => `₹${parseFloat(v||0).toLocaleString('en-IN')}`

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50 text-red-600',
    gray:   'bg-gray-100 text-gray-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
    refetchInterval: 60000,  // refresh every minute
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </DashboardLayout>
  )

  const s  = data?.summary        || {}
  const fs = data?.fee_stats       || {}
  const ms = data?.module_stats    || {}
  const mf = data?.monthly_fees    || []
  const at = data?.attendance_trend || []
  const cp = data?.class_performance || []
  const tp = data?.toppers          || []
  const rp = data?.recent_payments  || []
  const ue = data?.upcoming_events  || []

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Row 1: Primary stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Students"  value={s.total_students  || 0} icon="👨‍🎓" color="blue"   sub={`${s.total_classes} classes`} />
          <StatCard label="Total Teachers"  value={s.total_teachers  || 0} icon="👩‍🏫" color="purple" sub={`${s.total_parents} parents`} />
          <StatCard label="Fees Today"      value={fmt(s.fees_today)}       icon="💰" color="green"  sub={`Month: ${fmt(s.fees_this_month)}`} />
          <StatCard label="Outstanding"     value={fmt(fs.total_outstanding)} icon="⚠️" color="orange" sub="Current year" />
        </div>

        {/* ── Row 2: Module stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Books Issued"      value={s.books_issued          || 0} icon="📚" color="blue"   sub={`of ${s.total_books} total`} />
          <StatCard label="Overdue Books"     value={ms.overdue_books        || 0} icon="⏰" color="red"    sub="Return pending" />
          <StatCard label="Active Routes"     value={ms.active_routes        || 0} icon="🚌" color="green"  sub="Transport" />
          <StatCard label="Upcoming Exams"    value={ms.upcoming_exams       || 0} icon="📝" color="purple" sub="Scheduled" />
        </div>

        {/* ── Row 3: Charts ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Monthly Fee Collection */}
          <Section title="Monthly Fee Collection (Last 6 Months)">
            {mf.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mf} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [fmt(v), 'Collected']} />
                  <Bar dataKey="collected" fill="#2563eb" radius={[4,4,0,0]}>
                    {mf.map((_, i) => (
                      <Cell key={i} fill={i === mf.length - 1 ? '#16a34a' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Attendance Trend */}
          <Section title="Attendance Trend (Last 7 Days)">
            {at.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No attendance data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={at} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, name) => [
                    name === 'percentage' ? `${v}%` : v, name
                  ]} />
                  <Legend />
                  <Line
                    type="monotone" dataKey="percentage" name="Attendance %"
                    stroke="#16a34a" strokeWidth={2.5}
                    dot={{ fill: '#16a34a', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone" dataKey="absent" name="Absent"
                    stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 2"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* ── Row 4: Class performance radar + Toppers ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Class Performance Radar */}
          <Section title="Class-wise Performance (Latest Exam)">
            {cp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No exam data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={cp.slice(0, 8)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey={(d) => `${d.class_name}${d.section}`}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Avg %"
                    dataKey="avg_percentage"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.2}
                  />
                  <Tooltip formatter={v => [`${v}%`, 'Average']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Toppers */}
          <Section title="🏆 Top Performers (Latest Exam)">
            {tp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No exam results yet</p>
            ) : (
              <div className="space-y-2">
                {tp.map((topper, i) => (
                  <div key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ${i === 0 ? 'bg-yellow-100 text-yellow-700'
                        : i === 1 ? 'bg-gray-200 text-gray-600'
                        : i === 2 ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {topper.student_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {topper.class_name} {topper.section}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-blue-600">{topper.percentage}%</p>
                      <p className="text-xs text-gray-400">
                        {topper.total_obtained}/{topper.total_max}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Row 5: Recent payments + Upcoming events ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Recent Fee Payments */}
          <Section title="Recent Payments">
            {rp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No payments yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rp.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-sm">
                        💰
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{p.student_name}</p>
                        <p className="text-xs text-gray-400">{p.fee_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.method.replace('_',' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Upcoming Events */}
          <Section title="Upcoming Events">
            {ue.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {ue.map(ev => {
                  const color = TYPE_COLORS[ev.event_type] || '#64748b'
                  const days  = Math.ceil(
                    (new Date(ev.event_date) - new Date()) / 86400000
                  )
                  return (
                    <div key={ev.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                      <div className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ev.event_date).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-xs font-medium shrink-0" style={{ color }}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>

      </div>
    </DashboardLayout>
  )
}