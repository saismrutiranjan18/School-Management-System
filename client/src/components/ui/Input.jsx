import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  containerClass = '',
  ...props
}, ref) => (
  <div className={`flex flex-col gap-1 ${containerClass}`}>
    {label && (
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={`
          w-full h-10 px-3 rounded-xl text-sm border transition-all duration-200 bg-white dark:bg-slate-900
          border-slate-200 dark:border-slate-700
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-600
          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 dark:focus:border-primary-400
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800
          ${error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''}
          ${leftIcon ? 'pl-9' : ''}
          ${rightIcon ? 'pr-9' : ''}
          ${className}
        `}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 text-slate-400 dark:text-slate-500">
          {rightIcon}
        </span>
      )}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
))

Input.displayName = 'Input'

export const Select = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClass = '',
  children,
  ...props
}, ref) => (
  <div className={`flex flex-col gap-1 ${containerClass}`}>
    {label && (
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={`
        w-full h-10 px-3 rounded-xl text-sm border transition-all duration-200
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-700
        text-slate-900 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 dark:focus:border-primary-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-red-400 focus:ring-red-400/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
))

Select.displayName = 'Select'

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClass = '',
  ...props
}, ref) => (
  <div className={`flex flex-col gap-1 ${containerClass}`}>
    {label && (
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      rows={3}
      className={`
        w-full px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 resize-none
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-700
        text-slate-900 dark:text-slate-100
        placeholder-slate-400 dark:placeholder-slate-600
        focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 dark:focus:border-primary-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-red-400 focus:ring-red-400/30' : ''}
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
))

Textarea.displayName = 'Textarea'
