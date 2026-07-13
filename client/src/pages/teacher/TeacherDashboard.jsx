import { useSelector } from 'react-redux'
import { useQuery }    from '@tanstack/react-query'
import { fetchDashboard } from '../../api/analytics.api'
import DashboardLayout from '../../components/DashboardLayout'
import Card, { CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, Skeleton } from '../../components/ui/Skeleton'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, UserRound, X, CheckCircle2,
  BookMarked, Bell, ArrowUpRight, Users,
} from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const PRIORITY_CONFIG = {
  urgent: { variant: 'danger',  label: 'Urgent' },
  high:   { variant: 'warning', label: 'High'   },
  normal: { variant: 'info',    label: 'Normal'  },
  low:    { variant: 'default', label: 'Low'     },
}

export default function TeacherDashboard() {
  const { user }   = useSelector(state => state.auth)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  fetchDashboard,
  })

  if (isLoading) return (
    <DashboardLayout title="Dashboard">
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

  const classes = data?.my_classes       || []
  const today   = data?.today_attendance || {}
  const notices = data?.announcements    || []

  const present   = today.present     || 0
  const absent    = today.absent      || 0
  const marked    = today.total_marked|| 0
  const attPct    = marked > 0 ? Math.round((present / marked) * 100) : 0

  const pieData = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Absent',  value: absent,  color: '#ef4444' },
  ]

  const statCards = [
    { label: "Today's Marked",   value: marked,   icon: ClipboardCheck, gradient: 'from-slate-400 to-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800'   },
    { label: 'Present Students', value: present,  icon: CheckCircle2,   gradient: 'from-emerald-500 to-teal-600',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Absent Students',  value: absent,   icon: X,              gradient: 'from-red-500 to-rose-600',      bg: 'bg-red-50 dark:bg-red-900/20'         },
  ]

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Welcome banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Welcome back 👨‍🏫</p>
              <h2 className="text-white text-2xl font-bold font-display mt-0.5">{user?.name}</h2>
              <p className="text-blue-300 text-sm mt-1">
                You teach {classes.length} class{classes.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <p className="text-white text-2xl font-bold font-display">{attPct}%</p>
                <p className="text-blue-300 text-xs">Today's Attendance</p>
              </div>
              <div className="text-right">
                <p className="text-white text-2xl font-bold font-display">{classes.length}</p>
                <p className="text-blue-300 text-xs">Classes</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                  <s.icon size={19} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance donut */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardSubtitle>Present vs Absent breakdown</CardSubtitle>
            </CardHeader>
            {marked === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                No attendance marked today
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-[50%] h-[160px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                           dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-display">{attPct}%</p>
                    <p className="text-xs text-slate-400">Attendance Rate</p>
                  </div>
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* My Classes */}
          <Card>
            <CardHeader action={
              <span className="text-xs font-medium text-slate-400">{classes.length} classes</span>
            }>
              <CardTitle>My Classes</CardTitle>
              <CardSubtitle>Assigned teaching assignments</CardSubtitle>
            </CardHeader>
            {classes.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                No classes assigned
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {classes.map(cls => (
                  <div key={cls.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {cls.name?.replace('Class ', '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {cls.name} — {cls.section}
                      </p>
                      <p className="text-xs text-slate-400">
                        {cls.student_count} students
                      </p>
                    </div>
                    <Users size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Notices ── */}
        <Card>
          <CardHeader action={
            <button className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </button>
          }>
            <CardTitle>Recent Notices</CardTitle>
            <CardSubtitle>Latest school announcements</CardSubtitle>
          </CardHeader>
          {notices.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-slate-400">
              No announcements
            </div>
          ) : (
            <div className="space-y-2">
              {notices.slice(0, 5).map(n => {
                const cfg = PRIORITY_CONFIG[n.priority] || { variant: 'default', label: n.priority }
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={13} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0">{cfg.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  )
}