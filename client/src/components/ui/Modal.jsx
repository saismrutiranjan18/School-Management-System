import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Button from './Button'

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw]',
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ESC key to close
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && open) onClose?.() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`
              w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
              bg-white dark:bg-slate-900
              rounded-[20px] border border-slate-100 dark:border-slate-800
              shadow-2xl overflow-hidden
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                  {title && (
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                               dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
