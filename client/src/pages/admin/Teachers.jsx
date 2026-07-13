import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTeachers, createTeacher, updateTeacher, setTeacherStatus } from '../../api/teachers.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { UserPlus, UserRound, Users, UserX, Pencil, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { motion } from 'framer-motion'

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function AddTeacherModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    qualification: '', joining_date: new Date().toISOString().split('T')[0], salary: '',
  })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Add New Teacher" subtitle="Create a teacher account" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>Create Teacher</Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <Input label="Full Name" required {...f('name')} placeholder="Teacher's full name" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Login Email" type="email" required {...f('email')} />
          <Input label="Temp Password" required {...f('password')} />
        </div>
        <Input label="Qualification" {...f('qualification')} placeholder="e.g. M.Ed, B.Sc" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Joining Date" type="date" {...f('joining_date')} />
          <Input label="Salary (₹)" type="number" {...f('salary')} />
        </div>
      </div>
    </Modal>
  )
}

function EditTeacherModal({ onClose, teacher }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    qualification: teacher.qualification || '',
    salary: teacher.salary || '',
    joining_date: teacher.joining_date?.split('T')[0] || '',
  })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: (data) => updateTeacher(teacher.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Edit Teacher" subtitle={`${teacher.name} · ${teacher.email}`} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>Save Changes</Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <Input label="Qualification" {...f('qualification')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Joining Date" type="date" {...f('joining_date')} />
          <Input label="Salary (₹)" type="number" {...f('salary')} />
        </div>
      </div>
    </Modal>
  )
}

export default function Teachers() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const { data: teachers = [], isLoading } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers })

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setTeacherStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
    onError: (err) => alert(err.response?.data?.error || 'Failed.'),
  })

  const handleToggle = (t) => {
    if (confirm(t.is_active ? `Deactivate ${t.name}?` : `Reactivate ${t.name}?`))
      statusMutation.mutate({ id: t.id, is_active: !t.is_active })
  }

  const activeCount = teachers.filter(t => t.is_active).length

  const columns = [
    {
      header: 'Teacher', key: 'name',
      render: (_, t) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {t.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{t.name}</p>
            <p className="text-xs text-slate-400">{t.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Qualification', key: 'qualification', render: v => v || '—' },
    { header: 'Joining Date', key: 'joining_date', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { header: 'Salary', key: 'salary', render: v => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—' },
    { header: 'Status', key: 'is_active', sortable: false, render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, t) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(t)}>Edit</Button>
          <Button size="sm" variant={t.is_active ? 'danger' : 'success'}
            leftIcon={t.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
            onClick={() => handleToggle(t)}>
            {t.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  const statCards = [
    { label: 'Total Teachers', value: teachers.length, icon: UserRound, gradient: 'from-blue-500 to-indigo-600'   },
    { label: 'Active',         value: activeCount,       icon: Users,     gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Deactivated',    value: teachers.length - activeCount, icon: UserX, gradient: 'from-slate-400 to-slate-600' },
  ]

  return (
    <DashboardLayout title="Teachers">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Teachers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage teaching staff accounts</p>
          </div>
          <Button leftIcon={<UserPlus size={15} />} onClick={() => setModal('add')}>Add Teacher</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {statCards.map((s, i) => (
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

        <DataTable columns={columns} data={teachers} loading={isLoading}
          searchKeys={['name', 'email', 'qualification']} pageSize={12}
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><UserRound size={32} className="opacity-30" /><p className="text-sm">No teachers found</p></div>}
        />

        {modal === 'add' && <AddTeacherModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <EditTeacherModal teacher={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}