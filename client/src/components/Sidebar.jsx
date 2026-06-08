import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ADMIN_LINKS = [
  { to: '/admin/dashboard',        label: 'Dashboard',        icon: '🏠' },
  { to: '/admin/students',         label: 'Students',         icon: '👨‍🎓' },
  { to: '/admin/classes',          label: 'Classes',          icon: '🏫' },
  { to: '/admin/subjects',         label: 'Subjects',         icon: '📚' },
  { to: '/admin/timetable',        label: 'Timetable',        icon: '📅' },
  { to: '/admin/exams',            label: 'Exams',            icon: '📝' },
  { to: '/admin/fees/structure',   label: 'Fee Structure',    icon: '🏷️' },
  { to: '/admin/fees/collection',  label: 'Fee Collection',   icon: '💰' },
  { to: '/admin/fees/outstanding', label: 'Outstanding',      icon: '⚠️' },
  { to: '/admin/financial-report', label: 'Finance Report',   icon: '📊' },
  { to: '/admin/expenses',         label: 'Expenses',         icon: '💸' },
  { to: '/admin/announcements',    label: 'Announcements',    icon: '📢' },
  { to: '/admin/messages',   label: 'Messages', icon: '💬' },
  { to: '/admin/calendar',   label: 'Calendar', icon: '📅' },
  { to: '/admin/library',   label: 'Library', icon: '📚' },
  { to: '/admin/transport',   label: 'Transport', icon: '🚌' },




]

const TEACHER_LINKS = [
  { to: '/teacher/dashboard',          label: 'Dashboard',     icon: '🏠' },
  { to: '/teacher/timetable',          label: 'My Timetable',  icon: '📅' },
  { to: '/teacher/attendance/mark',    label: 'Attendance',    icon: '✅' },
  { to: '/teacher/attendance/report',  label: 'Att. Report',   icon: '📋' },
  { to: '/teacher/marks',              label: 'Enter Marks',   icon: '📝' },
  { to: '/teacher/announcements',      label: 'Notices',       icon: '📢' },
  { to: '/teacher/messages', label: 'Messages', icon: '💬' },
  { to: '/teacher/calendar', label: 'Calendar', icon: '📅' },


]

const STUDENT_LINKS = [
  { to: '/student/dashboard',  label: 'Dashboard',  icon: '🏠' },
  { to: '/student/timetable',  label: 'Timetable',  icon: '📅' },
  { to: '/student/attendance', label: 'Attendance', icon: '✅' },
  { to: '/student/results',    label: 'My Results', icon: '📝' },
  { to: '/student/fees',       label: 'My Fees',    icon: '💰' },
  { to: '/student/notices',    label: 'Notices',    icon: '📢' },
  { to: '/student/messages', label: 'Messages', icon: '💬' },
  { to: '/student/calendar', label: 'Calendar', icon: '📅' },
  { to: '/student/library', label: 'Library', icon: '📚' },
  { to: '/student/transport', label: 'Transport', icon: '🚌' },


]

const PARENT_LINKS = [
  { to: '/parent/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/parent/notices',   label: 'Notices',   icon: '📢' },
  { to: '/parent/messages',  label: 'Messages', icon: '💬' },
  { to: '/parent/calendar',  label: 'Calendar', icon: '📅' },
  { to: '/parent/transport',  label: 'Transport', icon: '🚌' },


]

const LINKS_MAP = {
  admin:   ADMIN_LINKS,
  teacher: TEACHER_LINKS,
  student: STUDENT_LINKS,
  parent:  PARENT_LINKS,
}

export default function Sidebar() {
  const { user } = useSelector(state => state.auth)
  const links    = LINKS_MAP[user?.role] || []

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold text-blue-600">SMS</span>
        <span className="text-xs text-gray-400 ml-2">v1.0</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all
              ${isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            <span className="text-base">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">School Management System</p>
      </div>
    </aside>
  )
}