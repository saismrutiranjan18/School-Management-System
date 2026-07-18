import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Sparkles, 
  Users, 
  BookOpen, 
  BarChart3, 
  Award, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Mail, 
  Phone, 
  BookOpenCheck, 
  Bus, 
  Key, 
  Clock
} from 'lucide-react'
import Button from '../components/ui/Button'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeRole, setActiveRole] = useState('admin')
  const [openFaq, setOpenFaq] = useState(null)

  // Portal Roles data
  const roles = [
    { id: 'admin', label: 'Admin Portal', desc: 'Manage institution, staff, billing & schedules' },
    { id: 'teacher', label: 'Teacher Portal', desc: 'Track attendance, insert marks & structure lessons' },
    { id: 'student', label: 'Student Portal', desc: 'Check timetables, exam results & library loans' },
    { id: 'parent', label: 'Parent Portal', desc: 'Monitor attendance, reports & pay outstanding fees' }
  ]

  // Features list
  const features = [
    { 
      icon: BookOpen, 
      title: 'Dynamic Timetables', 
      desc: 'Smart scheduler builder for conflicts resolution, classes, and subjects across all grades.',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      icon: Users, 
      title: 'Role-Based Dashboards', 
      desc: 'Custom UI interfaces tailored specifically for administrators, educators, students, and parents.',
      color: 'from-purple-500 to-indigo-500'
    },
    { 
      icon: BarChart3, 
      title: 'Attendance & Grades', 
      desc: 'Seamless attendance tracking and grading interface with live reports and parent notifications.',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      icon: Award, 
      title: 'Financial Management', 
      desc: 'Secure fee collections, billing configurations, outstanding dues alerts, and expense trackers.',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      icon: MessageSquare, 
      title: 'Unified Communication', 
      desc: 'Real-time announcements, localized school notice boards, and direct socket-driven chat messages.',
      color: 'from-pink-500 to-rose-500'
    },
    { 
      icon: BookOpenCheck, 
      title: 'Library & Transport', 
      desc: 'Comprehensive systems for cataloging library stock and managing vehicle routes and assignments.',
      color: 'from-cyan-500 to-teal-500'
    }
  ]

  // Mock Dashboard Previews for roles
  const previews = {
    admin: {
      title: 'Administrator Control Center',
      tagline: 'Manage your institution with real-time operational insights.',
      metrics: [
        { label: 'Total Enrollment', value: '1,248 Students', trend: '+4.2% this year' },
        { label: 'Active Faculty', value: '86 Teachers', trend: '98% retention' },
        { label: 'Fee Collection', value: '92.4%', trend: '+$12K outstanding' }
      ],
      quickView: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">New Registration Request</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">Pending Review</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Timetable Conflict Alert</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">Room 304</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Monthly Expense Report</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">Generated</span>
          </div>
        </div>
      )
    },
    teacher: {
      title: 'Educator Hub & Gradebook',
      tagline: 'Record attendance, marks, and connect with parents in minutes.',
      metrics: [
        { label: 'My Classes', value: '5 Courses', trend: 'Grade 9 - Grade 12' },
        { label: 'Today\'s Attendance', value: '98.5%', trend: 'Excellent attendance' },
        { label: 'Pending Grades', value: '18 Exams', trend: 'Due in 3 days' }
      ],
      quickView: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Next Period</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Mathematics Grade 10-A</span>
              <span className="text-xs text-primary-500 font-medium flex items-center gap-1">
                <Clock size={11} /> 10:15 AM
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Attendance Marked</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">10-B (Completed)</span>
          </div>
        </div>
      )
    },
    student: {
      title: 'Student Dashboard',
      tagline: 'Track your exams, homework, and stay up to date with notices.',
      metrics: [
        { label: 'GPA Metric', value: '3.82 / 4.0', trend: 'Top 5% of class' },
        { label: 'Timetable Lessons', value: '6 Periods', trend: 'Current day count' },
        { label: 'Books Borrowed', value: '2 Overdue', trend: 'Library Alert' }
      ],
      quickView: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Chemistry Exam</span>
              <span className="text-emerald-500 font-bold">Grade A (94%)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Biology Lab Submission</span>
            <span className="text-orange-500 dark:text-orange-400 font-medium">Due Tomorrow</span>
          </div>
        </div>
      )
    },
    parent: {
      title: 'Parent Portal & Tracker',
      tagline: 'Observe your child\'s performance, attendance and fees in real-time.',
      metrics: [
        { label: 'Child Attendance', value: '97.2%', trend: 'Ideal status' },
        { label: 'Report Status', value: 'Midterm', trend: 'Card ready for review' },
        { label: 'Outstanding Fees', value: '$150.00', trend: 'Due Aug 1, 2026' }
      ],
      quickView: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bus Live Route</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Route 4 - Near Central Park</span>
              <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase">En Route</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Teacher Note from Mrs. Davis</span>
            <span className="text-primary-500 font-semibold cursor-pointer hover:underline">Read Message</span>
          </div>
        </div>
      )
    }
  }

  // FAQ items
  const faqs = [
    { 
      q: 'How do I log in to my specific portal?', 
      a: 'Simply click the "Sign In" button at the top right of the landing page, or click any of the quick-portal action buttons in the hero section. On the login page, you can choose to enter your customized credentials or use our pre-filled demo accounts.' 
    },
    { 
      q: 'What roles are supported by the EduSaaS platform?', 
      a: 'EduSaaS offers comprehensive, distinct portals for Administrators (institution-wide operations, scheduling, billing), Teachers (attendance, scoring, scheduling), Students (calendar, grades, library, transit), and Parents (performance monitoring, billing, direct staff communications).' 
    },
    { 
      q: 'Can administrators build conflict-free timetables?', 
      a: 'Yes, our platform features a highly advanced visual Timetable Builder with automatic drag-and-drop slots, resolving conflicts when a room, subject teacher, or class conflicts are detected, streamlining school scheduling.' 
    },
    { 
      q: 'Is there a demo mode available to test components?', 
      a: 'Absolutely! At the bottom of the landing page or on the login page, we provide instant one-click demo credentials for Admin, Teacher, Student, and Parent accounts. You can sign in and play with all dashboards and features.' 
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090c15] dark:text-slate-100 selection:bg-primary-500 selection:text-white transition-colors duration-300">
      
      {/* ── Navigation Bar ── */}
      <nav className="sticky top-0 z-50 w-full glass backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-display">EduSaaS</span>
                <span className="block text-[10px] text-primary-500 font-semibold tracking-widest uppercase">Premium Hub</span>
              </div>
            </div>
            
            {/* Nav links - Desktop */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#features" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Features</a>
              <a href="#roles" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Portals</a>
              <a href="#credentials" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Demo Logins</a>
              <a href="#faq" className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => navigate('/login')}
                rightIcon={<ArrowRight size={15} />}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow Spheres */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-40 dark:opacity-30">
          <div className="absolute -top-10 left-10 w-72 h-72 rounded-full bg-primary-400 blur-[100px] animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-violet-400 blur-[130px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-600 dark:text-primary-400"
              >
                <Sparkles size={13} />
                <span>The complete Educational ERP</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] font-display"
              >
                Empowering Schools.<br />
                <span className="bg-gradient-to-r from-primary-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Inspiring Futures.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed"
              >
                A high-fidelity administrative suite connecting principals, teachers, parents, and students in one dynamic platform. Manage attendance, grading, financial dues, timetables, and messaging with premium micro-interactions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight size={16} />}
                  className="w-full sm:w-auto shadow-xl shadow-primary-600/20"
                >
                  Enter Platform
                </Button>
                <a href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Features
                  </Button>
                </a>
              </motion.div>

              {/* USP list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="pt-6 grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 text-left text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Real-time Chat & Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Conflict-free Scheduler</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Interactive Gradebooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Secure Financial Ledger</span>
                </div>
              </motion.div>
            </div>

            {/* Right Interactive Portal Portal Quick Launcher */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-indigo-500 rounded-3xl opacity-10 blur-2xl dark:opacity-20" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-shadow"
              >
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">
                  Access Your Portal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Select your role to quickly sign in to your custom interface.
                </p>

                <div className="space-y-3.5">
                  {roles.map((role) => (
                    <motion.div
                      key={role.id}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate('/login')}
                      className="group cursor-pointer p-4 rounded-2xl bg-slate-50 hover:bg-primary-50/50 dark:bg-slate-800/30 dark:hover:bg-primary-950/20 border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {role.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                          {role.desc}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 group-hover:bg-primary-600 dark:group-hover:bg-primary-500 group-hover:text-white text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="bg-slate-900 dark:bg-slate-950 text-white py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-400 font-display">150+</p>
              <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">Institutions</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-violet-400 font-display">50K+</p>
              <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">Active Users</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-fuchsia-400 font-display">99.9%</p>
              <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">System Uptime</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-display">24/7</p>
              <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider font-semibold">Support Operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Catalog ── */}
      <section id="features" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center space-y-4 mb-16 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
              Complete Institutional Control
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base font-light">
              All management pillars structured inside one fluid, fully integrated database infrastructure.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500/20 card-shadow transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} p-0.5 mb-5`}>
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-slate-800 dark:text-white">
                    <feature.icon size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Role Showcase (Interactive Slider) ── */}
      <section id="roles" className="py-20 lg:py-32 bg-slate-100/50 dark:bg-slate-950/40 border-y border-slate-200/50 dark:border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white leading-tight">
                Tailored for every member of your ecosystem
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed">
                Rather than overloading screens with irrelevant items, we deliver localized navigation and widgets custom-built for specific roles. Try navigating the tabs below to preview each dashboard module.
              </p>

              {/* Tabs list selector */}
              <div className="flex flex-col gap-2">
                {Object.keys(previews).map((roleKey) => (
                  <button
                    key={roleKey}
                    onClick={() => setActiveRole(roleKey)}
                    className={`
                      w-full text-left px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-between border
                      ${activeRole === roleKey 
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }
                    `}
                  >
                    <span className="capitalize">{roleKey} Dashboard</span>
                    <ArrowRight size={14} className={`opacity-80 transition-transform ${activeRole === roleKey ? 'translate-x-1' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Visual Sandbox Mockup */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-shadow space-y-6 relative overflow-hidden"
                >
                  {/* Decorative glow overlay */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />

                  {/* Header Mockup */}
                  <div>
                    <span className="text-[10px] text-primary-500 font-extrabold tracking-widest uppercase">
                      Live Dashboard Simulation
                    </span>
                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">
                      {previews[activeRole].title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-1">
                      {previews[activeRole].tagline}
                    </p>
                  </div>

                  {/* Simulated Metrics Card Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {previews[activeRole].metrics.map((met, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{met.label}</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-display">{met.value}</p>
                        <p className="text-[10px] text-emerald-500 font-medium mt-0.5">{met.trend}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick-list preview inside mockup container */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Overview Widgets
                    </p>
                    {previews[activeRole].quickView}
                  </div>

                  {/* Action Link Mockup */}
                  <div className="pt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/login')}
                      rightIcon={<ArrowRight size={13} />}
                      className="text-primary-600 dark:text-primary-400 font-bold"
                    >
                      Login to View Live
                    </Button>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* ── Demo Credentials CTA ── */}
      <section id="credentials" className="py-20 lg:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white relative overflow-hidden card-shadow">
            
            {/* Absolute gradients background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-900/0 to-slate-900/0 pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-xs font-semibold text-primary-300">
                <Key size={13} />
                <span>Instant Evaluation Accounts</span>
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
                Ready to explore? Try out our live demo portals.
              </h2>
              
              <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed">
                Log in as any of our standard testing users using the password <strong className="text-white font-semibold">"password"</strong>. No sign-up required.
              </p>

              {/* Grid with accounts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left pt-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center">
                  <p className="text-[10px] text-primary-400 uppercase tracking-widest font-bold">Admin</p>
                  <p className="text-xs font-mono font-medium text-slate-200 mt-1 truncate">admin@school.com</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center">
                  <p className="text-[10px] text-violet-400 uppercase tracking-widest font-bold">Teacher</p>
                  <p className="text-xs font-mono font-medium text-slate-200 mt-1 truncate">teacher@school.com</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center">
                  <p className="text-[10px] text-fuchsia-400 uppercase tracking-widest font-bold">Student</p>
                  <p className="text-xs font-mono font-medium text-slate-200 mt-1 truncate">student@school.com</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center">
                  <p className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">Parent</p>
                  <p className="text-xs font-mono font-medium text-slate-200 mt-1 truncate">parent@school.com</p>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight size={15} />}
                  className="shadow-lg shadow-primary-500/20"
                >
                  Log In Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="py-20 lg:py-32 bg-slate-100/50 dark:bg-slate-950/20 border-y border-slate-200/50 dark:border-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-light">
              Quick answers about portal access, account roles, and support configurations.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div 
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-bold text-sm sm:text-base text-slate-800 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={18} 
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${isOpen ? 'rotate-180 text-primary-500' : ''}`} 
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* Branding column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                  <GraduationCap size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white font-display">EduSaaS</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-light">
                Empowering educational academies through full-suite administration ERP, secure fee processing modules, digital grading ledgers, dynamic timetables and instant socket communication boards.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-4">
              <p className="text-white font-bold text-xs uppercase tracking-wider">Product</p>
              <ul className="space-y-2 text-xs font-light">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#roles" className="hover:text-white transition-colors">Dashboard Previews</a></li>
                <li><a href="#credentials" className="hover:text-white transition-colors">Demo Credentials</a></li>
              </ul>
            </div>

            {/* Support/Info */}
            <div className="md:col-span-4 space-y-4">
              <p className="text-white font-bold text-xs uppercase tracking-wider">Contact & Support</p>
              <ul className="space-y-2.5 text-xs text-slate-400 font-light">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-primary-400" />
                  <span>support@edusaas.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-violet-400" />
                  <span>+1 (555) 019-2834</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Safe 256-bit encryption routing</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-light">
            <p>© 2026 EduSaaS Systems Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
