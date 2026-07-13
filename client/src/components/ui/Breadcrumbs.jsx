import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

// Auto-generates breadcrumbs from the current URL path
// Optionally accepts a `custom` array of { label, href } to override
export default function Breadcrumbs({ custom }) {
  const { pathname } = useLocation()

  const crumbs = custom || pathname
    .split('/')
    .filter(Boolean)
    .map((segment, i, arr) => ({
      label: segment
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      href: '/' + arr.slice(0, i + 1).join('/'),
    }))

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <Link
        to="/"
        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <Home size={13} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-slate-700 dark:text-slate-200">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.href}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
