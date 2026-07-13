import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAnnouncements } from '../../api/announcements.api'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Megaphone, AlertTriangle, Bell, BellOff } from 'lucide-react'
import { motion } from 'framer-motion'

const PRIORITY_CONFIG = {
  urgent: { variant: 'danger', icon: AlertTriangle, border: 'border-red-200 dark:border-red-800/40' },
  high:   { variant: 'warning', icon: AlertTriangle, border: 'border-amber-200 dark:border-amber-800/40' },
  normal: { variant: 'info', icon: Bell, border: 'border-slate-200 dark:border-slate-700' },
  low:    { variant: 'default', icon: BellOff, border: 'border-slate-100 dark:border-slate-800' },
}

export default function NoticeBoard() {
  const [expanded, setExpanded] = useState(null)

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'], queryFn: fetchAnnouncements,
  })

  const urgent = announcements.filter(a => a.priority === 'urgent')
  const rest   = announcements.filter(a => a.priority !== 'urgent')

  return (
    <DashboardLayout title="Announcements">
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Notice Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {announcements.length} active notice{announcements.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading notices…</p></Card>
        ) : (
          <>
            {/* Urgent banner */}
            {urgent.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-500" />
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Urgent Notices</p>
                </div>
                {urgent.map(ann => (
                  <div key={ann.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-[20px] p-5">
                    <p className="font-semibold text-red-800 dark:text-red-300 text-sm">{ann.title}</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">{ann.body}</p>
                    <p className="text-xs text-red-400 dark:text-red-500 mt-2">
                      {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {rest.length === 0 && urgent.length === 0 && (
              <Card>
                <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                  <Megaphone size={48} className="opacity-30" />
                  <p className="text-sm">No notices at the moment</p>
                </div>
              </Card>
            )}

            {/* All notices */}
            <div className="space-y-3">
              {rest.map(ann => {
                const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal
                const Icon = cfg.icon
                const isExpanded = expanded === ann.id
                const isLong = ann.body.length > 150

                return (
                  <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
                    <Card className={`!border ${cfg.border}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <Icon size={16} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ann.title}</h3>
                            <Badge variant={cfg.variant}>{ann.priority}</Badge>
                            {ann.class_name && <Badge variant="purple">{ann.class_name} {ann.class_section}</Badge>}
                          </div>
                          <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                            {ann.body}
                          </p>
                          {isLong && (
                            <button onClick={() => setExpanded(isExpanded ? null : ann.id)}
                              className="text-xs text-primary-600 dark:text-primary-400 mt-1 hover:underline">
                              {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Posted by {ann.created_by_name} · {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}