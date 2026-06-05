import { useState, useRef, useEffect } from 'react'
import { useNotifications }            from '../hooks/useNotifications'
import { useSocket }                   from '../context/SocketContext'

const TYPE_STYLES = {
  announcement: { icon: '📢', color: 'text-blue-600',  bg: 'bg-blue-50'  },
  absence:      { icon: '⚠️', color: 'text-red-600',   bg: 'bg-red-50'   },
  fee_payment:  { icon: '💰', color: 'text-green-600', bg: 'bg-green-50' },
  default:      { icon: '🔔', color: 'text-gray-600',  bg: 'bg-gray-50'  },
}

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  normal: 'bg-blue-400',
  low:    'bg-gray-400',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications()
  const { connected } = useSocket()
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 1500) // mark all read after 1.5s of viewing
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Live indicator dot */}
        <span className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
          connected ? 'bg-green-400' : 'bg-gray-300'
        }`} />
      </button>

      {/* Drawer */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${connected ? 'text-green-600' : 'text-gray-400'}`}>
                {connected ? '● Live' : '○ Offline'}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  {connected ? 'Listening for live updates...' : 'Connecting...'}
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = TYPE_STYLES[notif.type] || TYPE_STYLES.default
                return (
                  <button
                    key={notif._id}
                    onClick={() => markRead(notif._id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition
                      ${!notif.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center text-sm shrink-0`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs font-semibold truncate ${style.color}`}>
                            {notif.title}
                          </p>
                          {notif.priority && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[notif.priority] || PRIORITY_DOT.normal}`} />
                          )}
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}