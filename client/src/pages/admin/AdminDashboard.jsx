import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout from '../../components/DashboardLayout'
import Card, { CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  GraduationCap, UserRound, DollarSign, AlertTriangle,
  BookOpen, Clock, Bus, FileText, TrendingUp, TrendingDown,
  ArrowUpRight, Calendar, MoreHorizontal, CheckCircle2, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'

const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`
const fmtK = v => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : fmt(v)

const TYPE_COLORS = {
  holiday: '#ef4444', exam: '#7c3aed', ptm: '#3b82f6',
  sports: '#10b981', cultural: '#f59e0b', meeting: '#06b6d4', general: '#64748b',
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, gradient, trend, trendUp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 card-shadow cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trendUp
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
          }`}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

// ── Chart tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Activity item ─────────────────────────────────────────────────────────────
function PaymentRow({ name, type, amount, method }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
          <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(amount)}</p>
        <p className="text-[10px] text-slate-400 capitalize">{method?.replace('_', ' ')}</p>
      </div>
    </div>
  )
}

// ── Upcoming event item ───────────────────────────────────────────────────────
function EventRow({ ev }) {
  const color = TYPE_COLORS[ev.event_type] || '#64748b'
  const days  = Math.ceil((new Date(ev.event_date) - new Date()) / 86400000)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '20' }}>
        <Calendar size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">{ev.title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(ev.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <Badge
        variant={days === 0 ? 'danger' : days <= 3 ? 'warning' : 'default'}
        className="shrink-0"
      >
        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
      </Badge>
    </div>
  )
}

// ── Topper row ────────────────────────────────────────────────────────────────
function TopperRow({ topper, rank }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
      <span className="text-lg shrink-0 w-6 text-center">{medals[rank] || `#${rank + 1}`}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{topper.student_name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{topper.class_name} {topper.section}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{topper.percentage}%</p>
        <p className="text-xs text-slate-400">{topper.total_obtained}/{topper.total_max}</p>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-72 card-shadow border border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-52 w-full" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-72 card-shadow border border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
      <DashboardSkeleton />
    </DashboardLayout>
  )

  const s  = data?.summary          || {}
  const fs = data?.fee_stats         || {}
  const ms = data?.module_stats      || {}
  const mf = data?.monthly_fees      || []
  const at = data?.attendance_trend  || []
  const cp = data?.class_performance || []
  const tp = data?.toppers           || []
  const rp = data?.recent_payments   || []
  const ue = data?.upcoming_events   || []

  const statCards = [
    { label: 'Total Students', value: s.total_students  || 0, icon: GraduationCap, gradient: 'from-violet-500 to-purple-700', sub: `${s.total_classes || 0} classes`, trend: '+2.5%', trendUp: true  },
    { label: 'Teachers',       value: s.total_teachers  || 0, icon: UserRound,     gradient: 'from-blue-500 to-indigo-700',  sub: `${s.total_parents || 0} parents`,  trend: '+0.8%', trendUp: true  },
    { label: 'Fees Collected', value: fmt(s.fees_today), icon: DollarSign,    gradient: 'from-emerald-500 to-teal-700',  sub: `Month: ${fmtK(s.fees_this_month)}`,  trend: '+12%',  trendUp: true  },
    { label: 'Outstanding',    value: fmt(fs.total_outstanding), icon: AlertTriangle, gradient: 'from-orange-400 to-rose-600',  sub: 'Current year', trend: '-3%', trendUp: false },
    { label: 'Books Issued',   value: ms.books_issued   || s.books_issued || 0, icon: BookOpen,   gradient: 'from-sky-500 to-blue-700',   sub: `of ${s.total_books || 0} total` },
    { label: 'Overdue Books',  value: ms.overdue_books  || 0, icon: Clock,       gradient: 'from-red-400 to-rose-600',     sub: 'Return pending' },
    { label: 'Active Routes',  value: ms.active_routes  || 0, icon: Bus,         gradient: 'from-amber-400 to-orange-600', sub: 'Transport' },
    { label: 'Upcoming Exams', value: ms.upcoming_exams || 0, icon: FileText,    gradient: 'from-violet-500 to-fuchsia-700',sub: 'Scheduled' },
  ]

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Welcome banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #5b21b6, #6d28d9)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 translate-y-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Good morning 👋</p>
              <h2 className="text-white text-xl font-bold font-display mt-0.5">School Overview</h2>
              <p className="text-purple-300 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-2xl font-bold font-display">{s.total_students || 0}</p>
                <p className="text-purple-300 text-xs">Total Students</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-right">
                <p className="text-white text-2xl font-bold font-display">{s.total_teachers || 0}</p>
                <p className="text-purple-300 text-xs">Total Teachers</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <StatCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* ── Charts row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Fee Collection Bar Chart */}
          <Card>
            <CardHeader action={
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            }>
              <CardTitle>Monthly Fee Collection</CardTitle>
              <CardSubtitle>Last 6 months revenue</CardSubtitle>
            </CardHeader>
            {mf.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-xs text-slate-400">No data yet</p>
              </div>
            ) : (
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mf} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip formatter={fmt} />} />
                    <Bar dataKey="collected" name="Collected" radius={[6, 6, 0, 0]}>
                      {mf.map((_, i) => (
                        <Cell key={i} fill={i === mf.length - 1 ? '#7c3aed' : '#a78bfa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Attendance Area Chart */}
          <Card>
            <CardHeader action={
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            }>
              <CardTitle>Attendance Trend</CardTitle>
              <CardSubtitle>Last 7 days attendance rate</CardSubtitle>
            </CardHeader>
            {at.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-xs text-slate-400">No attendance data yet</p>
              </div>
            ) : (
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={at} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip formatter={v => `${v}%`} />} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Area type="monotone" dataKey="percentage" name="Attendance %" stroke="#10b981" strokeWidth={2.5} fill="url(#attendGrad)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={1.5} fill="url(#absentGrad)" strokeDasharray="4 2" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* ── Charts row 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Performance</CardTitle>
              <CardSubtitle>Latest exam average scores</CardSubtitle>
            </CardHeader>
            {cp.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-xs text-slate-400">No exam data yet</p>
              </div>
            ) : (
              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={cp.slice(0, 8)}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey={d => `${d.class_name}${d.section}`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar name="Avg %" dataKey="avg_percentage" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                    <Tooltip content={<CustomTooltip formatter={v => `${v}%`} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader action={
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Latest Exam</span>
            }>
              <CardTitle>Top Performers</CardTitle>
              <CardSubtitle>Highest scoring students</CardSubtitle>
            </CardHeader>
            {tp.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-xs text-slate-400">No exam results yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {tp.map((topper, i) => (
                  <TopperRow key={i} topper={topper} rank={i} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Bottom row: payments + events ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader action={
              <button className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline">
                View all <ArrowUpRight size={12} />
              </button>
            }>
              <CardTitle>Recent Payments</CardTitle>
              <CardSubtitle>Latest fee transactions</CardSubtitle>
            </CardHeader>
            {rp.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-slate-400">No payments yet</p>
              </div>
            ) : (
              <div>
                {rp.map((p, i) => (
                  <PaymentRow key={i} name={p.student_name} type={p.fee_type} amount={p.amount} method={p.method} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader action={
              <button className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline">
                View all <ArrowUpRight size={12} />
              </button>
            }>
              <CardTitle>Upcoming Events</CardTitle>
              <CardSubtitle>Scheduled activities</CardSubtitle>
            </CardHeader>
            {ue.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-slate-400">No upcoming events</p>
              </div>
            ) : (
              <div>
                {ue.map(ev => <EventRow key={ev.id} ev={ev} />)}
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}