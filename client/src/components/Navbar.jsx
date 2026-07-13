import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '../features/auth/authSlice'
import { Search, LogOut, UserCircle, Settings, ChevronDown, X } from 'lucide-react'
import ThemeToggle from './ui/ThemeToggle'
import NotificationBell from './NotificationBell'
import Breadcrumbs from './ui/Breadcrumbs'

const ROLE_PROFILE_PATH = {
  admin:   '/admin/profile',
  teacher: '/teacher/profile',
  student: '/student/profile',
  parent:  '/parent/profile',
}

const ROLE_GRADIENT = {
  admin:   'from-violet-500 to-purple-600',
  teacher: 'from-blue-500 to-indigo-600',
  student: 'from-emerald-500 to-teal-600',
  parent:  'from-orange-400 to-rose-500',
}

export default function Navbar({ title }) {
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const { user }    = useSelector(state => state.auth)
  const [dropdown, setDropdown] = useState(false)
  const [search,   setSearch]   = useState('')
  const dropRef     = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const gradient = ROLE_GRADIENT[user?.role] || 'from-slate-400 to-slate-600'
  const initial  = user?.name?.charAt(0)?.toUpperCase() || '?'
  const profilePath = ROLE_PROFILE_PATH[user?.role] || '/login'

  return (
    <header className="
      h-16 shrink-0 sticky top-0 z-20 px-6
      flex items-center justify-between gap-4
      bg-slate-50/90 dark:bg-[#0c1020]/90
      backdrop-blur-xl
      border-b border-slate-100 dark:border-slate-800/70
    ">
      {/* Left — breadcrumb / title */}
      <div className="flex flex-col justify-center min-w-0">
        <Breadcrumbs />
        {title && (
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display leading-tight truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="
              h-9 w-48 pl-9 pr-3 text-sm rounded-xl border
              bg-slate-50 dark:bg-slate-900
              border-slate-200 dark:border-slate-700
              text-slate-800 dark:text-slate-200
              placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400
              focus:w-56 transition-all duration-300
            "
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dark mode toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User profile dropdown */}
        {user && (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdown(d => !d)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {initial}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">{user.role}</p>
              </div>
              <ChevronDown size={13} className={`text-slate-400 hidden md:block transition-transform duration-200 ${dropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="
                    absolute right-0 top-full mt-2 w-52
                    bg-white dark:bg-slate-900
                    border border-slate-100 dark:border-slate-800
                    rounded-2xl shadow-xl overflow-hidden z-50
                  "
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                  {/* Items */}
                  <div className="py-1">
                    <Link
                      to={profilePath}
                      onClick={() => setDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserCircle size={15} className="text-slate-400" />
                      My Profile
                    </Link>
                  </div>
                  <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  )
}