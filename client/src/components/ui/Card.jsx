import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  glass = false,
  onClick,
  ...props
}) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

  const base = `
    rounded-[20px] border transition-all duration-200
    ${glass
      ? 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/30 dark:border-slate-700/40'
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
    }
    card-shadow
    ${hover ? 'cursor-pointer hover:card-shadow-hover hover:-translate-y-0.5' : ''}
    ${paddings[padding]}
    ${className}
  `

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
        transition={{ duration: 0.2 }}
        className={base}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-800 dark:text-slate-100 font-display ${className}`}>
      {children}
    </h3>
  )
}

export function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}>
      {children}
    </p>
  )
}
