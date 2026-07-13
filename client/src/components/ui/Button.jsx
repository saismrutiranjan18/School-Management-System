import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-600',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
  outline:   'border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200',
  ghost:     'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
}

const sizes = {
  sm:  'h-8  px-3  text-xs  gap-1.5',
  md:  'h-9  px-4  text-sm  gap-2',
  lg:  'h-11 px-6  text-sm  gap-2',
  icon:'h-9  w-9   text-sm  p-0 justify-center',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center font-medium rounded-xl transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin shrink-0" />
        : leftIcon && <span className="shrink-0">{leftIcon}</span>
      }
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  )
})

Button.displayName = 'Button'
export default Button
