export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${100 / cols}%` }} />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, ri) => (
        <div
          key={ri}
          className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 flex gap-4"
        >
          {[...Array(cols)].map((_, ci) => (
            <Skeleton key={ci} className="h-4" style={{ width: `${100 / cols}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}
