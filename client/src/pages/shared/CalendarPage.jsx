import { useState, useMemo }     from 'react'
import { useSelector }           from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEvents, createEvent,
  updateEvent, deleteEvent,
} from '../../api/events.api'
import { fetchClasses } from '../../api/classes.api'

// ── Constants ──────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS       = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const EVENT_TYPES = [
  { value: 'holiday',  label: 'Holiday',      color: '#dc2626' },
  { value: 'exam',     label: 'Exam',         color: '#7c3aed' },
  { value: 'ptm',      label: 'Parent-Teacher Meet', color: '#2563eb' },
  { value: 'sports',   label: 'Sports',       color: '#16a34a' },
  { value: 'cultural', label: 'Cultural',     color: '#d97706' },
  { value: 'meeting',  label: 'Meeting',      color: '#0891b2' },
  { value: 'general',  label: 'General',      color: '#64748b' },
]

const TYPE_META = Object.fromEntries(
  EVENT_TYPES.map(t => [t.value, t])
)

// ── Helpers ────────────────────────────────────────────────────────────
const toYMD = (date) => date.toISOString().split('T')[0]

const getDaysInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay()
  const total    = new Date(year, month + 1, 0).getDate()
  return { firstDay, total }
}

const formatDisplay = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })

// ── Event Dot ──────────────────────────────────────────────────────────
function EventDot({ color }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

// ── Event Modal (Add / Edit) ───────────────────────────────────────────
function EventModal({ onClose, existing, defaultDate }) {
  const qc     = useQueryClient()
  const isEdit = !!existing

  const [form, setForm] = useState({
    title:        existing?.title        || '',
    description:  existing?.description  || '',
    event_date:   existing?.event_date?.split('T')[0] || defaultDate || '',
    end_date:     existing?.end_date?.split('T')[0]   || '',
    event_type:   existing?.event_type   || 'general',
    target_role:  existing?.target_role  || 'all',
    target_class: existing?.target_class || '',
    is_holiday:   existing?.is_holiday   || false,
  })
  const [error, setError] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn:  fetchClasses,
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateEvent(existing.id, data)
      : createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['upcoming-events'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const selectedType = TYPE_META[form.event_type]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedType?.color }}
          />
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Event' : 'Add Event'}
          </h2>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate({ ...form, target_class: form.target_class || null })
          }}
          className="space-y-4"
        >
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">Event Title</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Parent-Teacher Meeting"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700">Event Type</label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, event_type: t.value, is_holiday: t.value === 'holiday' })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition text-center
                    ${form.event_type === t.value
                      ? 'border-transparent text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  style={form.event_type === t.value
                    ? { backgroundColor: t.color, borderColor: t.color }
                    : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                End Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                min={form.event_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add more details..."
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Visible to</label>
              <select
                value={form.target_role}
                onChange={e => setForm({ ...form, target_role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Everyone</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
                <option value="parent">Parents</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Class <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.target_class}
                onChange={e => setForm({ ...form, target_class: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Holiday checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_holiday"
              checked={form.is_holiday}
              onChange={e => setForm({ ...form, is_holiday: e.target.checked })}
              className="w-4 h-4 accent-red-500"
            />
            <label htmlFor="is_holiday" className="text-sm text-gray-700">
              Mark as school holiday (highlighted on calendar)
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Day Detail Panel ──────────────────────────────────────────────────
function DayPanel({ date, events, onClose, onAdd, onEdit, onDelete, canEdit }) {
  return (
    <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
          <p className="text-xs text-gray-400">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onAdd(date)}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-xs text-gray-400">No events this day</p>
            {canEdit && (
              <button
                onClick={() => onAdd(date)}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Add an event
              </button>
            )}
          </div>
        ) : (
          events.map(ev => {
            const meta = TYPE_META[ev.event_type]
            return (
              <div
                key={ev.id}
                className="rounded-xl p-3 border"
                style={{
                  borderColor: meta?.color + '40',
                  backgroundColor: meta?.color + '10',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta?.color }}
                      />
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {ev.title}
                      </p>
                    </div>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white inline-block mb-1"
                      style={{ backgroundColor: meta?.color }}
                    >
                      {meta?.label}
                    </span>
                    {ev.end_date && ev.end_date !== ev.event_date && (
                      <p className="text-xs text-gray-400">
                        Until {formatDisplay(ev.end_date)}
                      </p>
                    )}
                    {ev.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                    {ev.class_name && (
                      <p className="text-xs text-gray-400 mt-1">
                        📚 {ev.class_name} {ev.class_section}
                      </p>
                    )}
                    {ev.is_holiday && (
                      <span className="text-xs text-red-500 font-medium">
                        🏖️ School Holiday
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(ev)}
                        className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(ev.id)}
                        className="text-xs px-2 py-0.5 border border-red-200 text-red-500 rounded hover:bg-red-50"
                      >
                        Del
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Upcoming Events Widget ─────────────────────────────────────────────
function UpcomingWidget({ events }) {
  if (!events?.length) return null

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Upcoming Events
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {events.map(ev => {
          const meta = TYPE_META[ev.event_type]
          const daysLeft = Math.ceil(
            (new Date(ev.event_date) - new Date()) / 86400000
          )
          return (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: meta?.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{ev.title}</p>
                <p className="text-xs text-gray-400">
                  {formatDisplay(ev.event_date)}
                </p>
              </div>
              <span className="text-xs font-medium shrink-0"
                style={{ color: meta?.color }}>
                {daysLeft === 0
                  ? 'Today'
                  : daysLeft === 1
                    ? 'Tomorrow'
                    : `${daysLeft}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Calendar Page ─────────────────────────────────────────────────
export default function CalendarPage() {
  const qc         = useQueryClient()
  const { user }   = useSelector(state => state.auth)
  const canEdit    = ['admin','teacher'].includes(user?.role)

  const now        = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected,  setSelected]  = useState(null)   // selected date string
  const [modal,     setModal]     = useState(null)   // null | 'add' | eventObj

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', monthStr],
    queryFn:  () => fetchEvents({ month: monthStr }),
  })

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn:  fetchUpcomingEvents,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['upcoming-events'] })
    },
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  // Build event map: { 'YYYY-MM-DD': [event, ...] }
  const eventMap = useMemo(() => {
    const map = {}
    events.forEach(ev => {
      if (!ev.event_date) return
      const key = ev.event_date.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(ev)

      // Multi-day events — fill each day in range
      if (ev.end_date && ev.end_date !== ev.event_date) {
        let cur = new Date(ev.event_date + 'T00:00:00')
        const end = new Date(ev.end_date + 'T00:00:00')
        cur.setDate(cur.getDate() + 1)
        while (cur <= end) {
          const k = toYMD(cur)
          if (!map[k]) map[k] = []
          if (!map[k].find(e => e.id === ev.id)) map[k].push(ev)
          cur.setDate(cur.getDate() + 1)
        }
      }
    })
    return map
  }, [events])

  const { firstDay, total } = getDaysInMonth(viewYear, viewMonth)
  const todayStr = toYMD(now)
  const selectedEvents = selected ? (eventMap[selected] || []) : []

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelected(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelected(null)
  }

  const handleDayClick = (dayStr) => {
    setSelected(prev => prev === dayStr ? null : dayStr)
  }

  const handleAdd = (date) => {
    setModal({ type: 'add', date })
  }

  const handleEdit = (ev) => {
    setModal({ type: 'edit', event: ev })
  }

  const handleDelete = (id) => {
    if (confirm('Delete this event?')) deleteMutation.mutate(id)
  }

  // Legend filter
  const [filterType, setFilterType] = useState('')
  const filteredEventMap = useMemo(() => {
    if (!filterType) return eventMap
    const map = {}
    Object.entries(eventMap).forEach(([k, evs]) => {
      const f = evs.filter(e => e.event_type === filterType)
      if (f.length) map[k] = f
    })
    return map
  }, [eventMap, filterType])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Event Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Holidays, exams, meetings and school events
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal({ type: 'add', date: todayStr })}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Event
          </button>
        )}
      </div>

      {/* Legend / filter */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition
            ${!filterType ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          All
        </button>
        {EVENT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilterType(prev => prev === t.value ? '' : t.value)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition
              ${filterType === t.value ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            style={filterType === t.value
              ? { backgroundColor: t.color, borderColor: t.color }
              : {}}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: filterType === t.value ? 'white' : t.color }}
            />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Left: Upcoming + Calendar */}
        <div className="flex-1 min-w-0">
          {/* Upcoming events */}
          <UpcomingWidget events={upcomingEvents} />

          {/* Calendar card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              >
                ‹
              </button>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-800">
                  {MONTHS[viewMonth]} {viewYear}
                </p>
              </div>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_OF_WEEK.map(d => (
                <div key={d}
                  className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {isLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">
                Loading calendar...
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
                ))}

                {/* Day cells */}
                {Array.from({ length: total }).map((_, i) => {
                  const day     = i + 1
                  const dayStr  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const dayEvs  = filteredEventMap[dayStr] || []
                  const isToday = dayStr === todayStr
                  const isSel   = dayStr === selected
                  const isHol   = dayEvs.some(e => e.is_holiday)
                  const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6

                  return (
                    <div
                      key={dayStr}
                      onClick={() => handleDayClick(dayStr)}
                      className={`min-h-[80px] p-1.5 border-b border-r border-gray-50 cursor-pointer transition-all
                        ${isSel    ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'  : ''}
                        ${isHol    ? 'bg-red-50'    : ''}
                        ${isWeekend && !isHol && !isSel ? 'bg-gray-50/50' : ''}
                        ${!isSel && !isHol ? 'hover:bg-gray-50' : ''}
                      `}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`
                          w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                          ${isToday
                            ? 'bg-blue-600 text-white'
                            : isHol
                              ? 'text-red-600'
                              : isWeekend
                                ? 'text-gray-400'
                                : 'text-gray-700'}
                        `}>
                          {day}
                        </span>

                        {canEdit && dayEvs.length === 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAdd(dayStr) }}
                            className="opacity-0 hover:opacity-100 group-hover:opacity-100 w-4 h-4 text-gray-300 hover:text-blue-500 text-xs"
                          >
                            +
                          </button>
                        )}
                      </div>

                      {/* Event dots / labels */}
                      <div className="space-y-0.5">
                        {dayEvs.slice(0, 3).map((ev, ei) => (
                          <div
                            key={ev.id + '-' + ei}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-white truncate"
                            style={{ backgroundColor: ev.color + 'cc', fontSize: '10px' }}
                          >
                            <EventDot color="white" />
                            <span className="truncate leading-tight">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvs.length > 3 && (
                          <p className="text-xs text-gray-400 pl-1">
                            +{dayEvs.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Day panel */}
        {selected && (
          <DayPanel
            date={selected}
            events={selectedEvents}
            onClose={() => setSelected(null)}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
          />
        )}
      </div>

      {/* Modal */}
      {modal && (
        <EventModal
          onClose={() => setModal(null)}
          existing={modal.type === 'edit' ? modal.event : null}
          defaultDate={modal.type === 'add' ? modal.date : null}
        />
      )}
    </div>
  )
}