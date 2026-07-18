import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchKeys = [],
  loading = false,
  emptyState,
  pageSize = 10,
  actions,     // JSX to render in the top-right (e.g. Add button)
  filterSlot,  // Extra filter UI below search bar
}) {
  const [query, setQuery]       = useState('')
  const [page, setPage]         = useState(1)
  const [sort, setSort]         = useState({ key: null, dir: 'asc' })

  // ── Filtering ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = data
    if (query.trim() && searchKeys.length) {
      const q = query.toLowerCase()
      rows = rows.filter(row =>
        searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
      )
    }
    if (sort.key) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.key] ?? ''
        const bv = b[sort.key] ?? ''
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, query, sort, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getVisiblePages = () => {
    const range = []
    const delta = 1
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      }
    }
    const visible = []
    let prev = null
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) {
          visible.push(prev + 1)
        } else if (i - prev > 2) {
          visible.push('...')
        }
      }
      visible.push(i)
      prev = i
    }
    return visible
  }

  const handleSort = (key) => {
    if (!key) return
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const SortIcon = ({ colKey }) => {
    if (sort.key !== colKey) return <ChevronsUpDown size={12} className="text-slate-300 dark:text-slate-600" />
    return sort.dir === 'asc'
      ? <ChevronUp size={12} className="text-primary-500" />
      : <ChevronDown size={12} className="text-primary-500" />
  }

  // ── Skeleton rows ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search..."
                className="
                  w-full h-9 pl-9 pr-3 text-sm rounded-xl border
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400
                "
              />
            </div>
          )}
          {filterSlot}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                    className={`
                      px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400
                      uppercase tracking-wide whitespace-nowrap
                      ${col.sortable !== false && col.key ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none' : ''}
                    `}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable !== false && col.key && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      {emptyState || (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Search size={32} className="opacity-30" />
                          <p className="text-sm font-medium">No results found</p>
                          {query && <p className="text-xs">Try adjusting your search</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, ri) => (
                    <motion.tr
                      key={row.id ?? ri}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: ri * 0.02 }}
                      className={`
                        border-b border-slate-50 dark:border-slate-800/60 last:border-0
                        hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100
                      `}
                    >
                      {columns.map((col, ci) => (
                        <td key={ci} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>–
              <span className="font-medium">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
              <span className="font-medium">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                           dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {getVisiblePages().map((p, i) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400 dark:text-slate-600">
                      ...
                    </span>
                  )
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`
                      w-7 h-7 rounded-lg text-xs font-medium transition-all duration-150
                      ${page === p
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                           dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
