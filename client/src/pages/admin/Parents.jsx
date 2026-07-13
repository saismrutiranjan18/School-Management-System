import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchParents, createParent, updateParent, setParentStatus } from '../../api/parents.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Users, UserPlus, UserX, Pencil, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight, Link as LinkIcon } from 'lucide-react'
import { motion } from 'framer-motion'

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function AddParentModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError]         = useState('')
  const [linkResult, setLinkResult] = useState(null)

  const mutation = useMutation({
    mutationFn: createParent,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parents'] })
      setLinkResult(data.linked_student)
      if (data.linked_student) setTimeout(onClose, 1800)
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Add Parent Account" subtitle="Email must match guardian email on the student's record" size="sm"
      footer={!linkResult && <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>Create Parent</Button>
      </>}
    >
      <ErrorAlert msg={error} />
      {linkResult && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Linked to student <strong>{linkResult}</strong>. Closing…</span>
        </div>
      )}
      {linkResult === false && (
        <div className="flex items-start gap-3 p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>Account created but <strong>no student linked yet.</strong> Ensure the guardian email on a student record matches this email.</span>
        </div>
      )}
      <div className="space-y-3">
        <Input label="Full Name" required placeholder="Parent's full name" {...f('name')} />
        <Input label="Login Email" type="email" required placeholder="Must match guardian email on student record" {...f('email')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Temp Password" required {...f('password')} />
          <Input label="Phone Number"  {...f('phone')} placeholder="Contact number" />
        </div>
      </div>
    </Modal>
  )
}

function EditParentModal({ onClose, parent }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ phone: parent.phone || '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => updateParent(parent.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parents'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  return (
    <Modal open onClose={onClose} title="Edit Parent" subtitle={`${parent.name} · ${parent.email}`} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>Save Changes</Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <Input label="Phone Number" value={form.phone}
        onChange={e => setForm({ phone: e.target.value })} placeholder="Contact number" />
    </Modal>
  )
}

export default function Parents() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const { data: parents = [], isLoading } = useQuery({ queryKey: ['parents'], queryFn: fetchParents })

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setParentStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parents'] }),
    onError: (err) => alert(err.response?.data?.error || 'Failed.'),
  })

  const handleToggle = (p) => {
    if (confirm(p.is_active ? `Deactivate ${p.name}?` : `Reactivate ${p.name}?`))
      statusMutation.mutate({ id: p.id, is_active: !p.is_active })
  }

  const linked    = parents.filter(p => p.student_name).length
  const unlinked  = parents.length - linked
  const active    = parents.filter(p => p.is_active).length

  const columns = [
    {
      header: 'Parent', key: 'name',
      render: (_, p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {p.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
            <p className="text-xs text-slate-400">{p.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Phone', key: 'phone', render: v => v || '—' },
    {
      header: 'Linked Student', key: 'student_name',
      render: (_, p) => p.student_name ? (
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <LinkIcon size={12} />
          <span className="text-sm font-medium">{p.student_name}</span>
          <span className="text-xs text-slate-400">{p.class_name} {p.section}</span>
        </div>
      ) : (
        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertCircle size={11} /> Not linked
        </span>
      ),
    },
    { header: 'Status', key: 'is_active', sortable: false, render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, p) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(p)}>Edit</Button>
          <Button size="sm" variant={p.is_active ? 'danger' : 'success'}
            leftIcon={p.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
            onClick={() => handleToggle(p)}>
            {p.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Parents">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Parents</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage parent portal accounts and student links</p>
          </div>
          <Button leftIcon={<UserPlus size={15} />} onClick={() => setModal('add')}>Add Parent</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Parents', value: parents.length, gradient: 'from-orange-400 to-rose-500',  icon: Users     },
            { label: 'Active',        value: active,         gradient: 'from-emerald-500 to-teal-600', icon: Users     },
            { label: 'Linked',        value: linked,         gradient: 'from-blue-500 to-indigo-600',  icon: LinkIcon  },
            { label: 'Unlinked',      value: unlinked,       gradient: 'from-amber-400 to-orange-500', icon: UserX     },
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

        <DataTable columns={columns} data={parents} loading={isLoading}
          searchKeys={['name', 'email', 'phone', 'student_name']} pageSize={12}
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><Users size={32} className="opacity-30" /><p className="text-sm">No parents yet</p></div>}
        />

        {modal === 'add' && <AddParentModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <EditParentModal parent={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}