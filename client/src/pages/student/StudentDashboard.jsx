import { useSelector } from 'react-redux'
import { useQuery }    from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout from '../../components/DashboardLayout'
import Card, { CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, Award, DollarSign, Bell, AlertCircle, ArrowUpRight,
} from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

export default function StudentDashboard() {
  const { user } = useSelector(state => state.auth)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    </DashboardLayout>
  )

  const student = data?.student       || {}
  const att     = data?.attendance    || {}
  const marks   = data?.recent_marks  || []
  const fees    = data?.fee_status    || {}
  const notices = data?.announcements || []

  const attPct   = parseFloat(att.percentage || 0)
  const attColor = attPct >= 75 ? '#10b981' : attPct >= 50 ? '#f59e0b' : '#ef4444'
  const isLow    = attPct < 75

  const radialData = [{ name: 'Attendance', value: attPct, fill: attColor }]

  const statCards = [
    {
      label: 'Attendance',
      value: `${attPct.toFixed(0)}%`,
      icon: ClipboardCheck,
      gradient: attPct >= 75 ? 'from-emerald-500 to-teal-600' : 'from-red-400 to-rose-600',
      sub: `${att.attended || 0} / ${att.total || 0} days`,
    },
    {
      label: 'Avg Score',
      value: marks.length ? `${(marks.reduce((s, m) => s + parseFloat(m.percentage || 0), 0) / marks.length).toFixed(0)}%` : 'N/A',
      icon: Award,
      gradient: 'from-violet-500 to-purple-600',
      sub: `${marks.length} exams`,
    },
    {
      label: 'Fees Paid',
      value: `₹${parseFloat(fees.paid || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-indigo-600',
      sub: `Balance: ₹${parseFloat(fees.balance || 0).toLocaleString('en-IN')}`,
    },
    {
      label: 'Notices',
      value: notices.length,
      icon: Bell,
      gradient: 'from-amber-400 to-orange-500',
      sub: 'Unread announcements',
    },
  ]

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Welcome banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #065f46, #059669, #10b981)' }}
        >
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-sm">Welcome back 🎓</p>
              <h2 className="text-white text-2xl font-bold font-display mt-0.5">{user?.name}</h2>
              <p className="text-emerald-300 text-sm mt-1">
                {student.class_name} — {student.section}
              </p>
            </div>
            {isLow && (
              <div className="hidden md:flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2">
                <AlertCircle size={16} className="text-red-300" />
                <div>
                  <p className="text-red-200 text-xs font-semibold">Low Attendance</p>
                  <p className="text-red-300 text-xs">Below 75% threshold</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Quick stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <Card className="cursor-default">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Attendance gauge + Results ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance radial */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardSubtitle>Last 30 days performance</CardSubtitle>
            </CardHeader>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%"
                    data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" background={{ fill: '#f1f5f9' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold font-display" style={{ color: attColor }}>
                    {attPct.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-400">Rate</p>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Present</span>
                  <span className="text-sm font-bold text-emerald-600">{att.attended || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Absent</span>
                  <span className="text-sm font-bold text-red-500">{(att.total || 0) - (att.attended || 0)} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{att.total || 0} days</span>
                </div>
                {isLow && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                    <AlertCircle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">Below 75% — attend more classes</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader action={
              <button className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline">
                View all <ArrowUpRight size={12} />
              </button>
            }>
              <CardTitle>Recent Exam Results</CardTitle>
              <CardSubtitle>Latest performance scores</CardSubtitle>
            </CardHeader>
            {marks.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-slate-400">
                No results published yet
              </div>
            ) : (
              <div className="space-y-2">
                {marks.slice(0, 5).map((m, i) => {
                  const pct = parseFloat(m.percentage || 0)
                  const color = pct >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                              : pct >= 50 ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                  const barW  = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  return (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{m.exam_name}</p>
                        <span className={`text-sm font-bold shrink-0 ml-2 ${color}`}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${barW}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Fee Status + Notices ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Status</CardTitle>
              <CardSubtitle>Current academic year</CardSubtitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Paid</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-display">
                  ₹{parseFloat(fees.paid || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${
                parseFloat(fees.balance || 0) > 0
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/30'
              }`}>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Balance Due</p>
                <p className={`text-xl font-bold font-display ${
                  parseFloat(fees.balance || 0) > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  ₹{parseFloat(fees.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Notices</CardTitle>
              <CardSubtitle>School announcements</CardSubtitle>
            </CardHeader>
            {notices.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-sm text-slate-400">No notices</div>
            ) : (
              <div className="space-y-2">
                {notices.slice(0, 3).map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={12} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}