import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import NotificationBell from './NotificationBell'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
)

const ROLE_COLORS = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
}

const LOGOUT_ICON = [
  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
  'M16 17l5-5-5-5',
  'M21 12H9',
]

export default function Navbar({ title }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">

      {/* Left — page title */}
      <h2 className="text-sm font-semibold text-gray-700">{title || 'Dashboard'}</h2>

      {/* Right — bell + user */}
      <div className="flex items-center gap-3">

        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2">

            {/* Avatar circle with initial */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center
                            justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>

            {/* Name + role badge */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {user.name}
              </p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                               capitalize ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                {user.role}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border
                         border-gray-200 rounded-lg text-gray-600 hover:bg-red-50
                         hover:text-red-600 hover:border-red-200 transition-colors"
              title="Logout"
            >
              <Icon d={LOGOUT_ICON} size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        )}
      </div>
    </header>
  )
}