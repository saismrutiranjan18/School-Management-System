import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useSocket } from '../context/SocketContext'

/* ── tiny SVG helper ── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} d={path} />)
      : <path d={d} />}
  </svg>
)

/* ── icon paths ── */
const ICONS = {
  bell:         ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  announcement: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  absence:      ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  fee_payment:  ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  message:      ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  default:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  checkAll:     ['M18 6 7 17l-5-5', 'M22 10l-7.5 7.5'],
  trash:        ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'],
  close:        ['M18 6 6 18', 'M6 6l12 12'],
}

/* ── colours per notification type ── */
const TYPE_STYLES = {
  announcement: { icon: ICONS.announcement, iconCls: 'text-blue-600',  bgCls: 'bg-blue-50',   dot: 'bg-blue-500'   },
  absence:      { icon: ICONS.absence,      iconCls: 'text-red-600',   bgCls: 'bg-red-50',    dot: 'bg-red-500'    },
  fee_payment:  { icon: ICONS.fee_payment,  iconCls: 'text-green-600', bgCls: 'bg-green-50',  dot: 'bg-green-500'  },
  message:      { icon: ICONS.message,      iconCls: 'text-indigo-600',bgCls: 'bg-indigo-50', dot: 'bg-indigo-500' },
  default:      { icon: ICONS.default,      iconCls: 'text-gray-500',  bgCls: 'bg-gray-100',  dot: 'bg-gray-400'   },
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
  const ref = useRef(null)

  /* close on outside click */
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 1500)
    }
  }

  return (
    <div className="relative" ref={ref}>

      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100
                   transition-colors focus:outline-none"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Icon d={ICONS.bell} size={20} />

        {/* unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
                           bg-red-500 text-white text-[10px] font-bold rounded-full
                           flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* live dot */}
        <span className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full
                          ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200
                        rounded-2xl shadow-xl z-50 overflow-hidden">

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px]
                                 font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* live indicator */}
              <span className={`text-xs font-medium flex items-center gap-1
                               ${connected ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block
                                  ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                {connected ? 'Live' : 'Offline'}
              </span>

              {/* mark all read */}
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1 rounded text-gray-400 hover:text-blue-600
                             hover:bg-blue-50 transition-colors"
                  title="Mark all as read"
                >
                  <Icon d={ICONS.checkAll} size={14} />
                </button>
              )}

              {/* clear all */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 rounded text-gray-400 hover:text-red-500
                             hover:bg-red-50 transition-colors"
                  title="Clear all"
                >
                  <Icon d={ICONS.trash} size={14} />
                </button>
              )}
            </div>
          </div>

          {/* list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="flex justify-center mb-2 text-gray-300">
                  <Icon d={ICONS.bell} size={32} />
                </div>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  {connected ? 'Listening for live updates…' : 'Connecting…'}
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = TYPE_STYLES[notif.type] || TYPE_STYLES.default
                return (
                  <button
                    key={notif._id}
                    onClick={() => markRead(notif._id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50
                                hover:bg-gray-50 transition-colors
                                ${!notif.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">

                      {/* type icon */}
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center
                                       justify-center shrink-0 ${style.bgCls}`}>
                        <Icon d={style.icon} size={15} className={style.iconCls} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs font-semibold truncate ${style.iconCls}`}>
                            {notif.title}
                          </p>
                          {/* priority dot */}
                          {notif.priority && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0
                                             ${PRIORITY_DOT[notif.priority] || PRIORITY_DOT.normal}`} />
                          )}
                          {/* unread dot */}
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}