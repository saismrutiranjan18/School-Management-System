import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '../features/auth/authSlice'
import {
  LayoutDashboard, Users, GraduationCap, UserRound, BookOpen,
  BookMarked, Calendar, CalendarDays, FileText, ClipboardList,
  DollarSign, ReceiptText, AlertTriangle, BarChart3, TrendingDown,
  Bell, MessageSquare, Library, Bus, ChevronLeft, ChevronRight,
  LogOut, Settings, Award, ClipboardCheck, PenLine, Building2, Tag,
} from 'lucide-react'

// ── Nav link definitions ─────────────────────────────────────────────────
const ADMIN_LINKS = [
  { section: 'Overview' },
  { to: '/admin/dashboard',        label: 'Dashboard',       icon: LayoutDashboard  },
  { section: 'People' },
  { to: '/admin/students',         label: 'Students',        icon: GraduationCap    },
  { to: '/admin/teachers',         label: 'Teachers',        icon: UserRound        },
  { to: '/admin/parents',          label: 'Parents',         icon: Users            },
  { section: 'Academics' },
  { to: '/admin/classes',          label: 'Classes',         icon: Building2        },
  { to: '/admin/subjects',         label: 'Subjects',        icon: BookMarked       },
  { to: '/admin/timetable',        label: 'Timetable',       icon: CalendarDays     },
  { to: '/admin/exams',            label: 'Exams',           icon: FileText         },
  { section: 'Finance' },
  { to: '/admin/fees/structure',   label: 'Fee Structure',   icon: Tag              },
  { to: '/admin/fees/collection',  label: 'Fee Collection',  icon: DollarSign       },
  { to: '/admin/fees/outstanding', label: 'Outstanding',     icon: AlertTriangle    },
  { to: '/admin/financial-report', label: 'Finance Report',  icon: BarChart3        },
  { to: '/admin/expenses',         label: 'Expenses',        icon: TrendingDown     },
  { section: 'Communication' },
  { to: '/admin/announcements',    label: 'Announcements',   icon: Bell             },
  { to: '/admin/messages',         label: 'Messages',        icon: MessageSquare    },
  { to: '/admin/calendar',         label: 'Calendar',        icon: Calendar         },
  { section: 'Services' },
  { to: '/admin/library',          label: 'Library',         icon: Library          },
  { to: '/admin/transport',        label: 'Transport',       icon: Bus              },
]

const TEACHER_LINKS = [
  { section: 'Overview' },
  { to: '/teacher/dashboard',         label: 'Dashboard',     icon: LayoutDashboard },
  { section: 'Teaching' },
  { to: '/teacher/timetable',         label: 'My Timetable',  icon: CalendarDays    },
  { to: '/teacher/attendance/mark',   label: 'Attendance',    icon: ClipboardCheck  },
  { to: '/teacher/attendance/report', label: 'Att. Report',   icon: BarChart3       },
  { to: '/teacher/marks',             label: 'Enter Marks',   icon: PenLine         },
  { section: 'Communication' },
  { to: '/teacher/announcements',     label: 'Notices',       icon: Bell            },
  { to: '/teacher/messages',          label: 'Messages',      icon: MessageSquare   },
  { to: '/teacher/calendar',          label: 'Calendar',      icon: Calendar        },
]

const STUDENT_LINKS = [
  { section: 'Overview' },
  { to: '/student/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { section: 'Academics' },
  { to: '/student/timetable',  label: 'Timetable',  icon: CalendarDays    },
  { to: '/student/attendance', label: 'Attendance', icon: ClipboardCheck  },
  { to: '/student/results',    label: 'My Results', icon: Award           },
  { section: 'Finance & Services' },
  { to: '/student/fees',       label: 'My Fees',    icon: DollarSign      },
  { to: '/student/library',    label: 'Library',    icon: Library         },
  { to: '/student/transport',  label: 'Transport',  icon: Bus             },
  { section: 'Communication' },
  { to: '/student/notices',    label: 'Notices',    icon: Bell            },
  { to: '/student/messages',   label: 'Messages',   icon: MessageSquare   },
  { to: '/student/calendar',   label: 'Calendar',   icon: Calendar        },
]

const PARENT_LINKS = [
  { section: 'Overview' },
  { to: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Communication' },
  { to: '/parent/notices',   label: 'Notices',   icon: Bell            },
  { to: '/parent/messages',  label: 'Messages',  icon: MessageSquare   },
  { to: '/parent/calendar',  label: 'Calendar',  icon: Calendar        },
  { section: 'Services' },
  { to: '/parent/transport', label: 'Transport', icon: Bus             },
]

const LINKS_MAP = { admin: ADMIN_LINKS, teacher: TEACHER_LINKS, student: STUDENT_LINKS, parent: PARENT_LINKS }

const ROLE_CONFIG = {
  admin:   { label: 'Administrator', color: 'from-violet-500 to-purple-600'   },
  teacher: { label: 'Teacher',       color: 'from-blue-500 to-indigo-600'     },
  student: { label: 'Student',       color: 'from-emerald-500 to-teal-600'    },
  parent:  { label: 'Parent',        color: 'from-orange-400 to-rose-500'     },
}

const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {}
  }
}

export default function Sidebar() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user }  = useSelector(state => state.auth)
  const [collapsed, setCollapsed] = useState(() => {
    return safeStorage.getItem('sidebar-collapsed') === 'true'
  })

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      safeStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const links     = LINKS_MAP[user?.role] || []
  const roleConf  = ROLE_CONFIG[user?.role] || { label: 'User', color: 'from-slate-400 to-slate-600' }
  const initial   = user?.name?.charAt(0)?.toUpperCase() || '?'

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <motion.aside
      style={{ width: collapsed ? 68 : 240 }}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="
        relative shrink-0 h-screen sticky top-0 flex flex-col overflow-visible z-20
        bg-slate-950 text-slate-300 border-r border-slate-800/50
      "
    >
      {/* ── Logo ── */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800/70 shrink-0">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleConf.color} flex items-center justify-center shrink-0`}>
          <GraduationCap size={16} className="text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold text-white font-display">EduSaaS</p>
              <p className="text-[10px] text-slate-500">School Management</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={toggleCollapse}
        className="
          absolute top-[4.25rem] -right-3 w-6 h-6 z-10
          bg-slate-900 border border-slate-700 rounded-full
          flex items-center justify-center text-slate-400
          hover:text-white hover:border-primary-500 transition-all duration-200 shadow-md
        "
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-none">
        {links.map((link, i) => {
          // Section header
          if (link.section) {
            if (collapsed) return null
            return (
              <p key={i} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {link.section}
              </p>
            )
          }

          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${isActive ? 'text-primary-400' : ''}`}
                  />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="truncate"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="shrink-0 border-t border-slate-800/70 p-3">
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className={`
              w-8 h-8 rounded-xl bg-gradient-to-br ${roleConf.color}
              flex items-center justify-center shrink-0 text-white text-xs font-bold
            `}>
              {initial}
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{roleConf.label}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  )
}