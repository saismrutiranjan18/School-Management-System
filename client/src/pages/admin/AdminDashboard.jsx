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

/* ── inline SVG icon ── */
const Icon = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  students:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  teachers:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  fees:        ['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  warning:     ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  books:       ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  clock:       ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 6v6l4 2'],
  bus:         ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z','M18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  exams:       ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  gold:        ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  payment:     ['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  calendar:    ['M8 2v4','M16 2v4','M3 10h18','M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z'],
}

const RANK_COLORS = [
  'bg-yellow-100 text-yellow-700',   // 1st
  'bg-gray-200   text-gray-600',     // 2nd
  'bg-orange-100 text-orange-700',   // 3rd
]

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, iconKey, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50    text-red-600',
    gray:   'bg-gray-100  text-gray-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                       ${colors[color]}`}>
        <Icon d={ICONS[iconKey]} size={18} />
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
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading dashboard…</p>
      </div>
    </DashboardLayout>
  )

  const s  = data?.summary         || {}
  const fs = data?.fee_stats        || {}
  const ms = data?.module_stats     || {}
  const mf = data?.monthly_fees     || []
  const at = data?.attendance_trend || []
  const cp = data?.class_performance|| []
  const tp = data?.toppers          || []
  const rp = data?.recent_payments  || []
  const ue = data?.upcoming_events  || []

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Row 1: Primary stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Students"  value={s.total_students  || 0} iconKey="students" color="blue"   sub={`${s.total_classes} classes`} />
          <StatCard label="Total Teachers"  value={s.total_teachers  || 0} iconKey="teachers" color="purple" sub={`${s.total_parents} parents`} />
          <StatCard label="Fees Today"      value={fmt(s.fees_today)}       iconKey="fees"     color="green"  sub={`Month: ${fmt(s.fees_this_month)}`} />
          <StatCard label="Outstanding"     value={fmt(fs.total_outstanding)} iconKey="warning" color="orange" sub="Current year" />
        </div>

        {/* ── Row 2: Module stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Books Issued"   value={s.books_issued       || 0} iconKey="books"  color="blue"   sub={`of ${s.total_books} total`} />
          <StatCard label="Overdue Books"  value={ms.overdue_books     || 0} iconKey="clock"  color="red"    sub="Return pending" />
          <StatCard label="Active Routes"  value={ms.active_routes     || 0} iconKey="bus"    color="green"  sub="Transport" />
          <StatCard label="Upcoming Exams" value={ms.upcoming_exams    || 0} iconKey="exams"  color="purple" sub="Scheduled" />
        </div>

        {/* ── Row 3: Charts ── */}
        <div className="grid grid-cols-2 gap-6">

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

          <Section title="Attendance Trend (Last 7 Days)">
            {at.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No attendance data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={at} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, name) => [name === 'percentage' ? `${v}%` : v, name]} />
                  <Legend />
                  <Line type="monotone" dataKey="percentage" name="Attendance %"
                    stroke="#16a34a" strokeWidth={2.5}
                    dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="absent" name="Absent"
                    stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* ── Row 4: Radar + Toppers ── */}
        <div className="grid grid-cols-2 gap-6">

          <Section title="Class-wise Performance (Latest Exam)">
            {cp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No exam data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={cp.slice(0, 8)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey={(d) => `${d.class_name}${d.section}`} tick={{ fontSize: 10 }} />
                  <Radar name="Avg %" dataKey="avg_percentage" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                  <Tooltip formatter={v => [`${v}%`, 'Average']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </Section>

          <Section title="Top Performers (Latest Exam)">
            {tp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No exam results yet</p>
            ) : (
              <div className="space-y-2">
                {tp.map((topper, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                    {/* rank badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                     shrink-0 ${RANK_COLORS[i] || 'bg-gray-100 text-gray-500'}`}>
                      {i < 3 ? (
                        <Icon d={ICONS.gold} size={14} />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
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

          <Section title="Recent Payments">
            {rp.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No payments yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {rp.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg
                                      flex items-center justify-center">
                        <Icon d={ICONS.payment} size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{p.student_name}</p>
                        <p className="text-xs text-gray-400">{p.fee_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {p.method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

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
                    <div key={ev.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color + '20' }}>
                        <Icon d={ICONS.calendar} size={15}
                          className="" style={{ color }} />
                      </div>
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