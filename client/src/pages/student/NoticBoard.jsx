import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAnnouncements } from '../../api/announcements.api'
import DashboardLayout from '../../components/DashboardLayout'

const PRIORITY_STYLES = {
  urgent: { card: 'border-red-200 bg-red-50',    badge: 'bg-red-100 text-red-700',       icon: '🚨' },
  high:   { card: 'border-orange-200 bg-orange-50', badge: 'bg-orange-100 text-orange-700', icon: '⚠️' },
  normal: { card: 'border-gray-200 bg-white',    badge: 'bg-blue-50 text-blue-700',       icon: '📢' },
  low:    { card: 'border-gray-100 bg-gray-50',  badge: 'bg-gray-100 text-gray-500',      icon: '🔕' },
}

export default function NoticeBoard() {
  const [expanded, setExpanded] = useState(null)

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn:  fetchAnnouncements,
  })

  const urgent = announcements.filter(a => a.priority === 'urgent')
  const rest   = announcements.filter(a => a.priority !== 'urgent')

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm text-center">Loading notices...</p>
  )

  return (
     <DashboardLayout title="Announcements">
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Notice Board</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {announcements.length} active notice{announcements.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Urgent notices banner */}
      {urgent.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
            🚨 Urgent Notices
          </p>
          {urgent.map(ann => (
            <div key={ann.id}
              className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-800 text-sm">{ann.title}</p>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">{ann.body}</p>
              <p className="text-xs text-red-400 mt-2">
                {new Date(ann.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* All other notices */}
      {rest.length === 0 && urgent.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No notices at the moment.</p>
        </div>
      )}

      <div className="space-y-3">
        {rest.map(ann => {
          const p          = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal
          const isExpanded = expanded === ann.id
          const isLong     = ann.body.length > 150

          return (
            <div key={ann.id}
              className={`border rounded-xl p-4 transition-all ${p.card}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-gray-800">{ann.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.badge}`}>
                      {ann.priority}
                    </span>
                    {ann.class_name && (
                      <span className="text-xs px-2 py-0.5 bg-white border border-purple-200 text-purple-700 rounded-full">
                        {ann.class_name} {ann.class_section}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm text-gray-600 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                    {ann.body}
                  </p>

                  {isLong && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : ann.id)}
                      className="text-xs text-blue-500 mt-1 hover:underline"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Posted by {ann.created_by_name} ·{' '}
                    {new Date(ann.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
        </div>
  </DashboardLayout>
)
}