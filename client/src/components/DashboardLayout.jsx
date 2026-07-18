import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

export default function DashboardLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950 dark:bg-[#060912] overflow-hidden">
      {/* Sidebar for Desktop + Drawer wrapper for Mobile */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-2 sm:p-3">
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0c1020] rounded-2xl sm:rounded-[24px] border border-slate-200/60 dark:border-slate-800/40">
          <Navbar title={title} setMobileOpen={setMobileOpen} />
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