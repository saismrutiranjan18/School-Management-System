import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({ children, title }) {
  return (
    <div className="flex h-screen bg-slate-950 dark:bg-[#060912] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-3">
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0c1020] rounded-[24px] border border-slate-200/60 dark:border-slate-800/40">
          <Navbar title={title} />
          <motion.main
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 overflow-y-auto"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  )
}