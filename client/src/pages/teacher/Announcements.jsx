import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchAnnouncements, createAnnouncement } from '../../api/announcements.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Megaphone, Plus, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PRIORITY_VARIANT = { urgent: 'danger', high: 'warning', normal: 'info', low: 'default' }

export default function TeacherAnnouncements() {
  const qc = useQueryClient()
  const { user } = useSelector(state => state.auth)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', body: '', target_role: 'student',
    target_class: '', priority: 'normal', send_email: false,
  })
  const [error, setError] = useState('')

  const { data: announcements = [], isLoading } = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowForm(false)
      setForm({ title: '', body: '', target_role: 'student', target_class: '', priority: 'normal', send_email: false })
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to post.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <DashboardLayout title="Announcements">
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Announcements</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View notices and post class announcements</p>
          </div>
          <Button leftIcon={showForm ? null : <Plus size={15} />} variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Post Notice'}
          </Button>
        </div>

        {/* Quick post form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Post a Notice</h2>
                {error && (
                  <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={14} className="shrink-0" />{error}
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate({ ...form, target_class: form.target_class || null }) }} className="space-y-3">
                  <Input placeholder="Notice title…" required {...f('title')} />
                  <Textarea placeholder="Write your notice here…" required {...f('body')} />
                  <div className="grid grid-cols-3 gap-3">
                    <Select {...f('target_role')}>
                      <option value="student">Students</option>
                      <option value="parent">Parents</option>
                      <option value="all">Everyone</option>
                    </Select>
                    <Select {...f('target_class')}>
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                    </Select>
                    <Select {...f('priority')}>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="te_send_email" checked={form.send_email}
                      onChange={e => setForm({ ...form, send_email: e.target.checked })}
                      className="w-4 h-4 accent-primary-600 rounded" />
                    <label htmlFor="te_send_email" className="text-sm text-slate-600 dark:text-slate-400">Send email notification</label>
                  </div>
                  <Button type="submit" loading={mutation.isPending} className="w-full">
                    Post Notice
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements list */}
        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card>
        ) : announcements.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Megaphone size={40} className="opacity-30" />
              <p className="text-sm">No announcements yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => (
              <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ann.title}</h3>
                        <Badge variant={PRIORITY_VARIANT[ann.priority] || 'default'}>{ann.priority}</Badge>
                        {ann.class_name && <Badge variant="purple">{ann.class_name} {ann.class_section}</Badge>}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{ann.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {ann.created_by_name} · {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}