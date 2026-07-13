import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        relative w-9 h-9 rounded-xl flex items-center justify-center
        text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
        hover:bg-slate-100 dark:hover:bg-slate-800
        transition-colors duration-200
        ${className}
      `}
    >
      <motion.span
        key={isDark ? 'moon' : 'sun'}
        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Moon size={17} /> : <Sun size={17} />}
      </motion.span>
    </motion.button>
  )
}
