import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/announcements.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Megaphone, Plus, Pencil, Trash2, AlertCircle, AlertTriangle, Bell, BellOff, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PRIORITY_CONFIG = {
  urgent: { variant: 'danger',  icon: AlertTriangle, border: 'border-red-200 dark:border-red-800/40'   },
  high:   { variant: 'warning', icon: AlertTriangle, border: 'border-amber-200 dark:border-amber-800/40' },
  normal: { variant: 'info',    icon: Bell,          border: 'border-slate-200 dark:border-slate-700'   },
  low:    { variant: 'default', icon: BellOff,       border: 'border-slate-100 dark:border-slate-800'   },
}

const ROLE_LABELS = { all: 'Everyone', teacher: 'Teachers', student: 'Students', parent: 'Parents' }

function AnnouncementModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    title: existing?.title || '', body: existing?.body || '',
    target_role: existing?.target_role || 'all', target_class: existing?.target_class || '',
    priority: existing?.priority || 'normal', is_active: existing?.is_active ?? true, send_email: false,
  })
  const [error, setError] = useState('')
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateAnnouncement(existing.id, data) : createAnnouncement(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Announcement' : 'New Announcement'}
      subtitle="Post a notice to the school community" size="md"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate({ ...form, target_class: form.target_class || null }) }}>
          {isEdit ? 'Update' : 'Post Announcement'}
        </Button>
      </>}
    >
      {error && <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400"><AlertCircle size={14} className="shrink-0" />{error}</div>}
      <div className="space-y-3">
        <Input label="Title" required placeholder="e.g. School closed on Friday" {...f('title')} />
        <Textarea label="Message" required placeholder="Write your announcement here…" {...f('body')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Target Audience" {...f('target_role')}>
            <option value="all">Everyone</option>
            <option value="teacher">Teachers only</option>
            <option value="student">Students only</option>
            <option value="parent">Parents only</option>
          </Select>
          <Select label="Priority" {...f('priority')}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <Select label="Target Class (optional)" {...f('target_class')}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
        </Select>
        <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 rounded-xl">
          <input type="checkbox" id="send_email" checked={form.send_email}
            onChange={e => setForm({ ...form, send_email: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-primary-600 rounded" />
          <label htmlFor="send_email" className="text-sm text-primary-700 dark:text-primary-300">
            Also send email notification
            <span className="block text-xs text-primary-500 dark:text-primary-400 mt-0.5">Recipients will receive this via Gmail SMTP</span>
          </label>
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 accent-primary-600 rounded" />
            <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">Active (visible to users)</label>
          </div>
        )}
      </div>
    </Modal>
  )
}

function AnnouncementCard({ ann, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal
  const Icon = cfg.icon

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
      <Card className={`!border ${cfg.border} ${!ann.is_active ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 shrink-0"><Icon size={16} className={`text-${cfg.variant === 'danger' ? 'red' : cfg.variant === 'warning' ? 'amber' : 'slate'}-500`} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{ann.title}</h3>
                <Badge variant={cfg.variant}>{ann.priority}</Badge>
                <Badge variant="default">→ {ROLE_LABELS[ann.target_role]}</Badge>
                {ann.class_name && <Badge variant="purple">{ann.class_name} {ann.class_section}</Badge>}
                {!ann.is_active && <Badge variant="default"><EyeOff size={10} className="mr-1" />Hidden</Badge>}
              </div>
              <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>{ann.body}</p>
              {ann.body.length > 120 && (
                <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-600 dark:text-primary-400 mt-1 hover:underline">
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-400">By {ann.created_by_name || 'Admin'}</span>
                <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                <span className="text-xs text-slate-400">{new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => onEdit(ann)}>Edit</Button>
            <Button size="sm" variant="danger" leftIcon={<Trash2 size={12} />} onClick={() => onDelete(ann.id)}>Delete</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default function Announcements() {
  const qc = useQueryClient()
  const [modal, setModal]                   = useState(null)
  const [filterRole, setFilterRole]         = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const { data: announcements = [], isLoading } = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const handleDelete = (id) => { if (confirm('Delete this announcement?')) deleteMutation.mutate(id) }

  const filtered = announcements.filter(a => {
    if (filterRole && a.target_role !== filterRole) return false
    if (filterPriority && a.priority !== filterPriority) return false
    return true
  })

  const urgentCount = announcements.filter(a => a.priority === 'urgent').length

  return (
    <DashboardLayout title="Announcements">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Announcements</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage school-wide notices and alerts</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>New Announcement</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',  value: announcements.length,                          icon: Megaphone,    gradient: 'from-violet-500 to-purple-600' },
            { label: 'Urgent', value: urgentCount,                                   icon: AlertTriangle,gradient: 'from-red-400 to-rose-600'      },
            { label: 'Active', value: announcements.filter(a => a.is_active).length, icon: Eye,          gradient: 'from-emerald-500 to-teal-600'  },
            { label: 'Hidden', value: announcements.filter(a => !a.is_active).length,icon: EyeOff,       gradient: 'from-slate-400 to-slate-600'   },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} containerClass="w-40">
            <option value="">All Audiences</option>
            <option value="all">Everyone</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </Select>
          <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} containerClass="w-40">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-16">Loading announcements…</p></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Megaphone size={40} className="opacity-30" />
              <p className="text-sm">No announcements found.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(ann => (
                <AnnouncementCard key={ann.id} ann={ann} onEdit={setModal} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {modal === 'add' && <AnnouncementModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <AnnouncementModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}