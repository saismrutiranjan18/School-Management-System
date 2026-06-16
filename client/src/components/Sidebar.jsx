import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  students:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  classes:      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  subjects:     ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  timetable:    ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z'],
  exams:        ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  feeStructure: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  feeCollection:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  outstanding:  ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  financeReport:['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  expenses:     ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  announcements:'M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0',
  messages:     ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  calendar:     ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z'],
  library:      ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  transport:    ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7V8z', 'M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  attendance:   ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  attReport:    ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  marks:        ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
  results:      ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  fees:         'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  notices:      ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  myFees:       'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
}

const ADMIN_LINKS = [
  { to: '/admin/dashboard',        label: 'Dashboard',      icon: 'dashboard'     },
  { to: '/admin/students',         label: 'Students',       icon: 'students'      },
  { to: '/admin/classes',          label: 'Classes',        icon: 'classes'       },
  { to: '/admin/subjects',         label: 'Subjects',       icon: 'subjects'      },
  { to: '/admin/timetable',        label: 'Timetable',      icon: 'timetable'     },
  { to: '/admin/exams',            label: 'Exams',          icon: 'exams'         },
  { to: '/admin/fees/structure',   label: 'Fee Structure',  icon: 'feeStructure'  },
  { to: '/admin/fees/collection',  label: 'Fee Collection', icon: 'feeCollection' },
  { to: '/admin/fees/outstanding', label: 'Outstanding',    icon: 'outstanding'   },
  { to: '/admin/financial-report', label: 'Finance Report', icon: 'financeReport' },
  { to: '/admin/expenses',         label: 'Expenses',       icon: 'expenses'      },
  { to: '/admin/announcements',    label: 'Announcements',  icon: 'announcements' },
  { to: '/admin/messages',         label: 'Messages',       icon: 'messages'      },
  { to: '/admin/calendar',         label: 'Calendar',       icon: 'calendar'      },
  { to: '/admin/library',          label: 'Library',        icon: 'library'       },
  { to: '/admin/transport',        label: 'Transport',      icon: 'transport'     },
]

const TEACHER_LINKS = [
  { to: '/teacher/dashboard',         label: 'Dashboard',   icon: 'dashboard'     },
  { to: '/teacher/timetable',         label: 'My Timetable',icon: 'timetable'     },
  { to: '/teacher/attendance/mark',   label: 'Attendance',  icon: 'attendance'    },
  { to: '/teacher/attendance/report', label: 'Att. Report', icon: 'attReport'     },
  { to: '/teacher/marks',             label: 'Enter Marks', icon: 'marks'         },
  { to: '/teacher/announcements',     label: 'Notices',     icon: 'notices'       },
  { to: '/teacher/messages',          label: 'Messages',    icon: 'messages'      },
  { to: '/teacher/calendar',          label: 'Calendar',    icon: 'calendar'      },
]

const STUDENT_LINKS = [
  { to: '/student/dashboard',  label: 'Dashboard',  icon: 'dashboard'     },
  { to: '/student/timetable',  label: 'Timetable',  icon: 'timetable'     },
  { to: '/student/attendance', label: 'Attendance', icon: 'attendance'    },
  { to: '/student/results',    label: 'My Results', icon: 'results'       },
  { to: '/student/fees',       label: 'My Fees',    icon: 'myFees'        },
  { to: '/student/notices',    label: 'Notices',    icon: 'notices'       },
  { to: '/student/messages',   label: 'Messages',   icon: 'messages'      },
  { to: '/student/calendar',   label: 'Calendar',   icon: 'calendar'      },
  { to: '/student/library',    label: 'Library',    icon: 'library'       },
  { to: '/student/transport',  label: 'Transport',  icon: 'transport'     },
]

const PARENT_LINKS = [
  { to: '/parent/dashboard', label: 'Dashboard', icon: 'dashboard'  },
  { to: '/parent/notices',   label: 'Notices',   icon: 'notices'    },
  { to: '/parent/messages',  label: 'Messages',  icon: 'messages'   },
  { to: '/parent/calendar',  label: 'Calendar',  icon: 'calendar'   },
  { to: '/parent/transport', label: 'Transport', icon: 'transport'  },
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
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold text-blue-600">SMS</span>
        <span className="text-xs text-gray-400 ml-2">v1.0</span>
      </div>

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
            <Icon d={ICONS[link.icon]} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">School Management System</p>
      </div>
    </aside>
  )
}