import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStudents, createStudent, updateStudent, setStudentStatus } from '../../api/students.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { UserPlus, GraduationCap, Users, UserX, Pencil, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddStudentModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    roll_no: '', class_id: '', dob: '', gender: '',
    address: '', guardian_name: '', guardian_phone: '', guardian_email: '',
  })
  const [error, setError] = useState('')
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Add New Student" subtitle="Create a new student account" size="md"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          Create Student
        </Button>
      </>}
    >
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" required {...f('name')} placeholder="Student's full name" />
          <Input label="Roll No" {...f('roll_no')} placeholder="e.g. 2024001" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Login Email" type="email" required {...f('email')} placeholder="student@school.edu" />
          <Input label="Temporary Password" type="text" required {...f('password')} placeholder="Student can change later" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Select label="Class" required {...f('class_id')}>
            <option value="">Select...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Input label="Date of Birth" type="date" {...f('dob')} />
          <Select label="Gender" {...f('gender')}>
            <option value="">--</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <Input label="Address" {...f('address')} placeholder="Full address" />
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Guardian / Parent</p>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Guardian name" {...f('guardian_name')} />
            <Input placeholder="Phone number" {...f('guardian_phone')} />
            <Input type="email" placeholder="Guardian email" {...f('guardian_email')} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Guardian email links the parent portal. Create a matching parent login on the Parents page.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditStudentModal({ onClose, student }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    roll_no: student.roll_no || '', class_id: student.class_id || '',
    dob: student.dob?.split('T')[0] || '', gender: student.gender || '',
    address: student.address || '', guardian_name: student.guardian_name || '',
    guardian_phone: student.guardian_phone || '', guardian_email: student.guardian_email || '',
  })
  const [error, setError] = useState('')
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: (data) => updateStudent(student.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Edit Student" subtitle={`${student.name} · ${student.email}`} size="md"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          Save Changes
        </Button>
      </>}
    >
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Roll No" {...f('roll_no')} />
          <Select label="Class" {...f('class_id')}>
            <option value="">--</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
          <Select label="Gender" {...f('gender')}>
            <option value="">--</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date of Birth" type="date" {...f('dob')} />
          <Input label="Address" {...f('address')} />
        </div>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Guardian / Parent</p>
          <div className="grid grid-cols-3 gap-3">
            <Input placeholder="Guardian name" {...f('guardian_name')} />
            <Input placeholder="Phone number" {...f('guardian_phone')} />
            <Input type="email" placeholder="Guardian email" {...f('guardian_email')} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Students() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'add' | studentObj
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

  const { data: students = [], isLoading } = useQuery({ queryKey: ['students'], queryFn: fetchStudents })
  const { data: classes  = [] }            = useQuery({ queryKey: ['classes'],  queryFn: fetchClasses  })

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setStudentStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
    onError:   (err) => alert(err.response?.data?.error || 'Failed to update status.'),
  })

  const handleToggleStatus = (s) => {
    const msg = s.is_active
      ? `Deactivate ${s.name}? They will lose login access but all records are preserved.`
      : `Reactivate ${s.name}'s account?`
    if (confirm(msg)) statusMutation.mutate({ id: s.id, is_active: !s.is_active })
  }

  const displayData = students.filter(s => {
    if (filterClass && String(s.class_id) !== filterClass) return false
    if (filterStatus === 'active' && !s.is_active) return false
    if (filterStatus === 'inactive' && s.is_active) return false
    return true
  })

  const activeCount   = students.filter(s => s.is_active).length
  const inactiveCount = students.length - activeCount

  const columns = [
    {
      header: 'Student',
      key: 'name',
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {s.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
            <p className="text-xs text-slate-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Class', key: 'class_name',
      render: (_, s) => s.class_name ? `${s.class_name} — ${s.section}` : <span className="text-slate-300">—</span>,
    },
    { header: 'Roll No', key: 'roll_no', render: v => v || '—' },
    {
      header: 'Guardian', key: 'guardian_name',
      render: (_, s) => (
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{s.guardian_name || '—'}</p>
          {s.guardian_email && <p className="text-xs text-slate-400">{s.guardian_email}</p>}
        </div>
      ),
    },
    {
      header: 'Status', key: 'is_active', sortable: false,
      render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(s)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant={s.is_active ? 'danger' : 'success'}
            leftIcon={s.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
            onClick={() => handleToggleStatus(s)}
          >
            {s.is_active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Students">
      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Students</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage student accounts and guardian details</p>
          </div>
          <Button leftIcon={<UserPlus size={15} />} onClick={() => setModal('add')}>
            Add Student
          </Button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Students', value: students.length, icon: GraduationCap, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Active',         value: activeCount,      icon: Users,          gradient: 'from-emerald-500 to-teal-600'  },
            { label: 'Deactivated',    value: inactiveCount,    icon: UserX,          gradient: 'from-slate-400 to-slate-600'   },
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

        {/* ── DataTable ── */}
        <DataTable
          columns={columns}
          data={displayData}
          loading={isLoading}
          searchKeys={['name', 'email', 'roll_no', 'guardian_name']}
          pageSize={12}
          actions={
            <>
              <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 text-sm">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
              </Select>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 text-sm">
                <option value="active">Active only</option>
                <option value="inactive">Deactivated</option>
                <option value="">All</option>
              </Select>
            </>
          }
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8">
              <GraduationCap size={32} className="text-slate-200 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500">No students found</p>
            </div>
          }
        />

        {/* ── Modals ── */}
        {modal === 'add' && <AddStudentModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <EditStudentModal student={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}