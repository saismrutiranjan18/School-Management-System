import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects.api'
import { fetchClasses } from '../../api/classes.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { BookOpen, Plus, Pencil, Trash2, AlertCircle, BookMarked, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function SubjectModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    name: existing?.name || '', code: existing?.code || '',
    class_id: existing?.class_id || '', teacher_id: existing?.teacher_id || '',
  })
  const [error, setError] = useState('')

  const { data: classes  = [] } = useQuery({ queryKey: ['classes'],  queryFn: fetchClasses })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(r => r.data) })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateSubject(existing.id, data) : createSubject(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Subject' : 'Add New Subject'}
      subtitle="Configure subject and assign a teacher" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          {isEdit ? 'Save Changes' : 'Create Subject'}
        </Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Subject Name" required placeholder="e.g. Mathematics" {...f('name')} />
          <Input label="Subject Code" required placeholder="e.g. MATH10"    {...f('code')} />
        </div>
        <Select label="Class" required {...f('class_id')}>
          <option value="">-- Select Class --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
        </Select>
        <Select label="Assign Teacher (optional)" {...f('teacher_id')}>
          <option value="">-- Select Teacher --</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </div>
    </Modal>
  )
}

export default function Subjects() {
  const qc = useQueryClient()
  const [modal, setModal]           = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: classes  = [] }            = useQuery({ queryKey: ['classes'],  queryFn: fetchClasses  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const filtered = filterClass ? subjects.filter(s => String(s.class_id) === filterClass) : subjects

  const columns = [
    {
      header: 'Subject', key: 'name',
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <BookOpen size={13} className="text-white" />
          </div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
        </div>
      ),
    },
    { header: 'Code', key: 'code', render: v => <Badge variant="purple">{v}</Badge> },
    { header: 'Class',   key: 'class_name',   render: (_, s) => s.class_name ? `${s.class_name} — ${s.section}` : '—' },
    { header: 'Teacher', key: 'teacher_name', render: v => v || <span className="text-slate-300 dark:text-slate-600 text-xs">Unassigned</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(s)}>Edit</Button>
          <Button size="sm" variant="danger"  leftIcon={<Trash2 size={12} />}
            onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id) }}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Subjects">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Subjects</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage subjects and assign teachers</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>Add Subject</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Subjects', value: subjects.length,                                          gradient: 'from-indigo-500 to-purple-600', icon: BookOpen   },
            { label: 'Classes',        value: [...new Set(subjects.map(s => s.class_id))].length,       gradient: 'from-violet-500 to-purple-600', icon: BookMarked },
            { label: 'Unassigned',     value: subjects.filter(s => !s.teacher_name).length,             gradient: 'from-slate-400 to-slate-600',   icon: UserRound  },
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

        <DataTable columns={columns} data={filtered} loading={isLoading}
          searchKeys={['name', 'code', 'class_name', 'teacher_name']} pageSize={15}
          actions={
            <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 text-sm">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
            </Select>
          }
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><BookOpen size={32} className="opacity-30" /><p className="text-sm">No subjects found</p></div>}
        />

        {modal === 'add' && <SubjectModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <SubjectModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}