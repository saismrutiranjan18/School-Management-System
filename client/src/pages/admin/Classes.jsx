import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses, createClass, updateClass, deleteClass } from '../../api/classes.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { Building2, Plus, Pencil, Trash2, AlertCircle, BookMarked, Users } from 'lucide-react'
import { motion } from 'framer-motion'

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function ClassModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    name: existing?.name || '',
    section: existing?.section || '',
    academic_year: existing?.academic_year || '2024-25',
    class_teacher_id: existing?.class_teacher_id || '',
  })
  const [error, setError] = useState('')

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateClass(existing.id, data) : createClass(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Class' : 'Add New Class'}
      subtitle="Configure class details and assign a teacher" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          {isEdit ? 'Save Changes' : 'Create Class'}
        </Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Class Name" required placeholder="e.g. Class 10" {...f('name')} />
          <Input label="Section"    required placeholder="e.g. A"         {...f('section')} />
        </div>
        <Input label="Academic Year" required placeholder="e.g. 2024-25" {...f('academic_year')} />
        <Select label="Class Teacher" {...f('class_teacher_id')}>
          <option value="">-- Select Teacher --</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </div>
    </Modal>
  )
}

export default function Classes() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'add' | classObj

  const { data: classes = [], isLoading } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
    onError: (err) => alert(err.response?.data?.error || 'Cannot delete class — likely has students or timetable entries.'),
  })

  const handleDelete = (c) => {
    if (confirm(`Delete ${c.name} ${c.section}? This cannot be undone.`))
      deleteMutation.mutate(c.id)
  }

  const columns = [
    {
      header: 'Class', key: 'name',
      render: (_, c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {c.name?.replace('Class ', '')}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{c.name} — {c.section}</p>
            <p className="text-xs text-slate-400">{c.academic_year}</p>
          </div>
        </div>
      ),
    },
    { header: 'Class Teacher',  key: 'teacher_name',   render: v => v || '—' },
    {
      header: 'Students', key: 'student_count',
      render: v => (
        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Users size={13} className="text-slate-400" /> {v || 0}
        </span>
      ),
    },
    { header: 'Subjects',       key: 'subject_count',  render: v => v || 0 },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, c) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(c)}>Edit</Button>
          <Button size="sm" variant="danger"  leftIcon={<Trash2 size={12} />} onClick={() => handleDelete(c)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Classes">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Classes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage school classes and sections</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>Add Class</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Classes', value: classes.length,                                       icon: Building2,  gradient: 'from-violet-500 to-purple-600' },
            { label: 'Total Students',value: classes.reduce((s, c) => s + (c.student_count || 0), 0), icon: Users, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Total Subjects',value: classes.reduce((s, c) => s + (c.subject_count || 0), 0), icon: BookMarked, gradient: 'from-emerald-500 to-teal-600' },
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

        <DataTable columns={columns} data={classes} loading={isLoading} searchKeys={['name', 'section', 'teacher_name']}
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><Building2 size={32} className="opacity-30" /><p className="text-sm">No classes yet</p></div>}
        />

        {modal === 'add' && <ClassModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <ClassModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}
