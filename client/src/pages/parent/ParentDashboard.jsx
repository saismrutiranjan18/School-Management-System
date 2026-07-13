import { useQuery }    from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout from '../../components/DashboardLayout'
import Card, { CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, DollarSign, Award, Bell, AlertCircle,
  Users, ArrowUpRight,
} from 'lucide-react'

export default function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  const child = data?.child

  if (isLoading) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    </DashboardLayout>
  )

  if (!child || child.error) return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6">
        <Card>
          <EmptyState
            icon={Users}
            title="No child linked"
            description="Contact the school administration to link your child's profile to this account."
          />
        </Card>
      </div>
    </DashboardLayout>
  )

  const student = child.student      || {}
  const att     = child.attendance   || {}
  const marks   = child.recent_marks || []
  const fees    = child.fee_status   || {}
  const notices = child.announcements || []
  const attPct  = parseFloat(att.percentage || 0)
  const balance = parseFloat(fees.balance || 0)
  const isLow   = attPct < 75
  const hasDue  = balance > 0

  const statCards = [
    {
      label: 'Attendance',
      value: `${attPct.toFixed(0)}%`,
      sub:   `${att.attended || 0} / ${att.total || 0} days`,
      icon:  ClipboardCheck,
      gradient: isLow ? 'from-red-400 to-rose-600' : 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Fee Balance',
      value: `₹${balance.toLocaleString('en-IN')}`,
      sub:   hasDue ? 'Payment pending' : 'All clear',
      icon:  DollarSign,
      gradient: hasDue ? 'from-red-400 to-rose-600' : 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Latest Exam',
      value: marks[0] ? `${marks[0].percentage}%` : 'N/A',
      sub:   marks[0]?.exam_name || 'No results yet',
      icon:  Award,
      gradient: 'from-violet-500 to-purple-600',
    },
  ]

  return (
    <DashboardLayout title="Parent Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Welcome banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #92400e, #d97706, #f59e0b)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-amber-200 text-sm">Welcome 👨‍👩‍👧</p>
              <h2 className="text-white text-2xl font-bold font-display mt-0.5">{student.name}</h2>
              <p className="text-amber-300 text-sm mt-1">
                {student.class_name} — {student.section} · Roll No: {student.roll_no || 'N/A'}
              </p>
            </div>
            {isLow && (
              <div className="hidden md:flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2">
                <AlertCircle size={16} className="text-red-300" />
                <div>
                  <p className="text-red-200 text-xs font-semibold">Low Attendance Alert</p>
                  <p className="text-red-300 text-xs">Below 75% — take action</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
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

        {/* ── Alerts ── */}
        {(isLow || hasDue) && (
          <div className="space-y-3">
            {isLow && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Attendance Warning</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {student.name}'s attendance is {att.percentage}%, below the required 75%.
                    Please ensure regular school attendance.
                  </p>
                </div>
              </div>
            )}
            {hasDue && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <DollarSign size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Fee Payment Due</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    ₹{balance.toLocaleString('en-IN')} is pending. Please contact the school fee office.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Results + Notices ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card>
            <CardHeader action={
              <button className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
                View all <ArrowUpRight size={12} />
              </button>
            }>
              <CardTitle>Recent Exam Results</CardTitle>
              <CardSubtitle>{student.name}'s performance</CardSubtitle>
            </CardHeader>
            {marks.length === 0 ? (
              <EmptyState icon={Award} title="No results" compact description="No exam results published yet." />
            ) : (
              <div className="space-y-2">
                {marks.slice(0, 5).map((m, i) => {
                  const pct = parseFloat(m.percentage || 0)
                  const bar = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  const col = pct >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                            : pct >= 50 ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                  return (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex justify-between mb-1.5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.exam_name}</p>
                        <span className={`text-sm font-bold ${col}`}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School Notices</CardTitle>
              <CardSubtitle>Latest announcements</CardSubtitle>
            </CardHeader>
            {notices.length === 0 ? (
              <EmptyState icon={Bell} title="No notices" compact description="No recent announcements." />
            ) : (
              <div className="space-y-2">
                {notices.slice(0, 5).map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={12} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
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