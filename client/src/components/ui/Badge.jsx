const variants = {
  default:  'bg-slate-100  text-slate-600  dark:bg-slate-800 dark:text-slate-300',
  primary:  'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  success:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning:  'bg-amber-100   text-amber-700   dark:bg-amber-900/30 dark:text-amber-400',
  danger:   'bg-red-100     text-red-700     dark:bg-red-900/30 dark:text-red-400',
  info:     'bg-sky-100     text-sky-700     dark:bg-sky-900/30 dark:text-sky-400',
  purple:   'bg-violet-100  text-violet-700  dark:bg-violet-900/30 dark:text-violet-400',
}

export default function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) {
  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger:  'bg-red-500',
    info:    'bg-sky-500',
    purple:  'bg-violet-500',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full
      ${variants[variant]} ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}

// Pre-configured status badge for common school statuses
export function StatusBadge({ status }) {
  const map = {
    active:    { variant: 'success', label: 'Active'    },
    inactive:  { variant: 'danger',  label: 'Inactive'  },
    present:   { variant: 'success', label: 'Present'   },
    absent:    { variant: 'danger',  label: 'Absent'    },
    late:      { variant: 'warning', label: 'Late'      },
    paid:      { variant: 'success', label: 'Paid'      },
    unpaid:    { variant: 'danger',  label: 'Unpaid'    },
    partial:   { variant: 'warning', label: 'Partial'   },
    pending:   { variant: 'warning', label: 'Pending'   },
    approved:  { variant: 'success', label: 'Approved'  },
    rejected:  { variant: 'danger',  label: 'Rejected'  },
    issued:    { variant: 'info',    label: 'Issued'    },
    returned:  { variant: 'success', label: 'Returned'  },
    overdue:   { variant: 'danger',  label: 'Overdue'   },
    scheduled: { variant: 'primary', label: 'Scheduled' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled:  { variant: 'default', label: 'Cancelled'  },
    published:  { variant: 'success', label: 'Published'  },
    draft:      { variant: 'default', label: 'Draft'      },
    male:       { variant: 'info',    label: 'Male'       },
    female:     { variant: 'purple',  label: 'Female'     },
    other:      { variant: 'default', label: 'Other'      },
  }

  const cfg = map[status?.toLowerCase()] || { variant: 'default', label: status }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}
