import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchExams, createExam, updateExam, deleteExam } from '../../api/exams.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { FileText, Plus, Pencil, Trash2, AlertCircle, Calendar, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function ExamModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    name:          existing?.name          || '',
    class_id:      existing?.class_id      || '',
    start_date:    existing?.start_date?.split('T')[0] || '',
    end_date:      existing?.end_date?.split('T')[0]   || '',
    academic_year: existing?.academic_year || '2024-25',
    is_published:  existing?.is_published  || false,
  })
  const [error, setError] = useState('')
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateExam(existing.id, data) : createExam(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Exam' : 'Schedule Exam'} subtitle="Configure exam details" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          {isEdit ? 'Save Changes' : 'Schedule Exam'}
        </Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <Input label="Exam Name" required placeholder="e.g. Mid-Term 2024" {...f('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Class" required {...f('class_id')}>
            <option value="">-- Select --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Input label="Academic Year" placeholder="2024-25" {...f('academic_year')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" {...f('start_date')} />
          <Input label="End Date"   type="date" {...f('end_date')} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_published"
            checked={form.is_published}
            onChange={e => setForm({ ...form, is_published: e.target.checked })}
            className="w-4 h-4 rounded accent-primary-600"
          />
          <label htmlFor="is_published" className="text-sm text-slate-700 dark:text-slate-300">
            Publish results immediately (visible to students & parents)
          </label>
        </div>
      </div>
    </Modal>
  )
}

export default function Exams() {
  const qc = useQueryClient()
  const [filterClass, setFilterClass] = useState('')
  const [modal, setModal] = useState(null)

  const { data: exams   = [], isLoading } = useQuery({ queryKey: ['exams', filterClass], queryFn: () => fetchExams(filterClass || undefined) })
  const { data: classes = [] }            = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
    onError: (err) => alert(err.response?.data?.error || 'Cannot delete exam.'),
  })

  const handleDelete = (e) => {
    if (confirm(`Delete exam "${e.name}"? All subject entries will also be removed.`))
      deleteMutation.mutate(e.id)
  }

  const published   = exams.filter(e => e.is_published).length
  const unpublished = exams.length - published

  const columns = [
    {
      header: 'Exam', key: 'name',
      render: (_, e) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
            <p className="text-xs text-slate-400">{e.academic_year}</p>
          </div>
        </div>
      ),
    },
    { header: 'Class', key: 'class_name', render: (_, e) => e.class_name ? `${e.class_name} — ${e.section}` : '—' },
    { header: 'Start',  key: 'start_date', render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { header: 'End',    key: 'end_date',   render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { header: 'Status', key: 'is_published', sortable: false, render: v => <StatusBadge status={v ? 'published' : 'draft'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, e) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(e)}>Edit</Button>
          <Button size="sm" variant="danger"  leftIcon={<Trash2 size={12} />} onClick={() => handleDelete(e)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Exams">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Exams</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Schedule and manage examinations</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>Schedule Exam</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Exams', value: exams.length,  icon: FileText,  gradient: 'from-violet-500 to-fuchsia-600' },
            { label: 'Published',   value: published,     icon: BookOpen,  gradient: 'from-emerald-500 to-teal-600'   },
            { label: 'Draft',       value: unpublished,   icon: Calendar,  gradient: 'from-slate-400 to-slate-600'    },
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

        <DataTable
          columns={columns}
          data={exams}
          loading={isLoading}
          searchKeys={['name', 'class_name', 'academic_year']}
          actions={
            <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 text-sm">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
            </Select>
          }
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><FileText size={32} className="opacity-30" /><p className="text-sm">No exams scheduled</p></div>}
        />

        {modal === 'add' && <ExamModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <ExamModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}