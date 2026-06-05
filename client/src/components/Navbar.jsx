import { useSelector, useDispatch } from 'react-redux'
import { useNavigate }              from 'react-router-dom'
import { logout }                   from '../features/auth/authSlice'
import NotificationBell             from './NotificationBell'

const ROLE_COLORS = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
}

export default function Navbar({ title }) {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useSelector(state => state.auth)

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
        {/* Notification Bell */}
        <NotificationBell />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800">{user.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}