import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement,
} from '../../api/announcements.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'

const PRIORITY_STYLES = {
  urgent: { badge: 'bg-red-100 text-red-700 border-red-200',    dot: 'bg-red-500',    label: '🚨 Urgent'  },
  high:   { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: '⚠️ High'    },
  normal: { badge: 'bg-blue-50 text-blue-700 border-blue-200',  dot: 'bg-blue-400',   label: '📢 Normal'  },
  low:    { badge: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400',   label: '🔕 Low'     },
}

const ROLE_LABELS = {
  all:     'Everyone',
  teacher: 'Teachers',
  student: 'Students',
  parent:  'Parents',
}

function AnnouncementModal({ onClose, existing }) {
  const qc     = useQueryClient()
  const isEdit = !!existing

  const [form, setForm] = useState({
    title:        existing?.title        || '',
    body:         existing?.body         || '',
    target_role:  existing?.target_role  || 'all',
    target_class: existing?.target_class || '',
    priority:     existing?.priority     || 'normal',
    is_active:    existing?.is_active    ?? true,
    send_email:   false,
  })
  const [error, setError] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateAnnouncement(existing.id, data)
      : createAnnouncement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      ...form,
      target_class: form.target_class || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Announcement' : 'New Announcement'}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. School closed on Friday"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Write your announcement here..."
              rows={4}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Target + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Target Audience</label>
              <select
                value={form.target_role}
                onChange={e => setForm({ ...form, target_role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Everyone</option>
                <option value="teacher">Teachers only</option>
                <option value="student">Students only</option>
                <option value="parent">Parents only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Target class (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Target Class <span className="text-gray-400 font-normal">(optional — leave blank for all)</span>
            </label>
            <select
              value={form.target_class}
              onChange={e => setForm({ ...form, target_class: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
              ))}
            </select>
          </div>

          {/* Send email toggle */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <input
              type="checkbox"
              id="send_email"
              checked={form.send_email}
              onChange={e => setForm({ ...form, send_email: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-blue-600"
            />
            <label htmlFor="send_email" className="text-sm text-blue-700">
              Also send email notification to target audience
              <span className="block text-xs text-blue-500 mt-0.5">
                Recipients will receive this via Gmail SMTP
              </span>
            </label>
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>
          )}

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
              {mutation.isPending
                ? 'Posting...'
                : isEdit ? 'Update' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Announcement Card ──────────────────────────────────────────────────
function AnnouncementCard({ ann, onEdit, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const p = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal

  return (
    <div className={`bg-white border rounded-xl p-5 transition-all ${
      ann.priority === 'urgent'
        ? 'border-red-200 shadow-sm'
        : ann.priority === 'high'
          ? 'border-orange-200'
          : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Priority dot */}
          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${p.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-800 text-sm">{ann.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${p.badge}`}>
                {p.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                → {ROLE_LABELS[ann.target_role]}
              </span>
              {ann.class_name && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
                  {ann.class_name} {ann.class_section}
                </span>
              )}
              {!ann.is_active && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
                  Hidden
                </span>
              )}
            </div>

            <p className={`text-sm text-gray-600 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
              {ann.body}
            </p>

            {ann.body.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-500 mt-1 hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400">
                By {ann.created_by_name || 'Admin'}
              </span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400">
                {new Date(ann.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onEdit(ann)}
              className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(ann.id)}
              className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Announcements() {
  const qc = useQueryClient()
  const [modal,       setModal]       = useState(null)
  const [filterRole,  setFilterRole]  = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn:  fetchAnnouncements,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['announcements'] }),
    onError:    (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const handleDelete = (id) => {
    if (confirm('Delete this announcement?'))
      deleteMutation.mutate(id)
  }

  const filtered = announcements.filter(a => {
    if (filterRole     && a.target_role !== filterRole)     return false
    if (filterPriority && a.priority    !== filterPriority) return false
    return true
  })

  const urgentCount = announcements.filter(a => a.priority === 'urgent').length

  return (
  <DashboardLayout title="Announcements">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage school-wide notices and alerts</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',   value: announcements.length,                         color: 'text-gray-800'  },
          { label: 'Urgent',  value: urgentCount,                                  color: 'text-red-600'   },
          { label: 'Active',  value: announcements.filter(a => a.is_active).length, color: 'text-green-600' },
          { label: 'Hidden',  value: announcements.filter(a => !a.is_active).length, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Audiences</option>
          <option value="all">Everyone</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
          <option value="parent">Parents</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-gray-400 text-sm text-center py-16">Loading announcements...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">
          No announcements found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              isAdmin={true}
              onEdit={setModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <AnnouncementModal
          onClose={() => setModal(null)}
          existing={modal === 'add' ? null : modal}
        />
      )}
    </div>
  </DashboardLayout>
)
}