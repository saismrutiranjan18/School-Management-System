import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginUser } from '../features/auth/authSlice'
import { GraduationCap, Eye, EyeOff, AlertCircle, BookOpen, Users, Award, BarChart3 } from 'lucide-react'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import ThemeToggle from '../components/ui/ThemeToggle'

const ROLE_REDIRECTS = {
  admin:   '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent:  '/parent/dashboard',
}

const features = [
  { icon: Users,    title: 'Manage Everyone',   desc: 'Students, teachers & parents in one place' },
  { icon: BookOpen, title: 'Academics',          desc: 'Classes, subjects, timetables & exams'     },
  { icon: BarChart3,title: 'Analytics',          desc: 'Real-time insights and performance data'   },
  { icon: Award,    title: 'Results & Fees',     desc: 'Exam results and fee management'           },
]

export default function Login() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { loading, error } = useSelector(state => state.auth)
  const [form, setForm]   = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) {
      navigate(ROLE_REDIRECTS[result.payload.user.role] || '/')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090c15]">
      {/* ── Left panel (decorative) ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)' }}
      >
        {/* Background decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -right-24 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 left-1/4 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-white/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white font-display">EduSaaS</p>
            <p className="text-xs text-purple-200">Premium School Hub</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white font-display leading-tight">
              The smartest way<br />to manage your school
            </h2>
            <p className="text-purple-200 text-base">
              Everything you need to run a modern school — in one beautiful platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-purple-300">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-purple-400">© 2026 EduSaaS. All rights reserved.</p>
        </div>
      </motion.div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with theme toggle */}
        <div className="flex justify-between items-center px-4 sm:px-8 py-4">
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white font-display">EduSaaS</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md space-y-6 sm:space-y-8"
          >
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in to your EduSaaS account to continue
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-xl"
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@school.edu"
                autoComplete="email"
              />

              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                rightIcon={
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2.5">Demo credentials (password is "password")</p>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex justify-between gap-4"><span>Admin:</span><span>admin@school.com</span></div>
                <div className="flex justify-between gap-4"><span>Teacher:</span><span>teacher@school.com</span></div>
                <div className="flex justify-between gap-4"><span>Student:</span><span>student@school.com</span></div>
                <div className="flex justify-between gap-4"><span>Parent:</span><span>parent@school.com</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}