import { motion } from 'framer-motion'

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description = '',
  action,
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 gap-3' : 'py-16 gap-4'}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon size={24} className="text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <div className="space-y-1">
        <p className={`font-semibold text-slate-600 dark:text-slate-300 ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </p>
        {description && (
          <p className={`text-slate-400 dark:text-slate-500 ${compact ? 'text-xs' : 'text-sm'} max-w-xs mx-auto`}>
            {description}
          </p>
        )}
      </div>
      {action && action}
    </motion.div>
  )
}
