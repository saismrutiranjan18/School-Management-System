import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../../api/expenses.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Receipt, Plus, Pencil, Trash2, AlertCircle, TrendingDown, Layers } from 'lucide-react'
import { motion } from 'framer-motion'

const CATEGORIES = ['Salaries','Utilities','Maintenance','Stationery','Equipment','Events','Transport','Other']

const CAT_VARIANT = {
  Salaries: 'info', Utilities: 'warning', Maintenance: 'danger', Stationery: 'success',
  Equipment: 'purple', Events: 'primary', Transport: 'info', Other: 'default',
}

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function ExpenseModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: existing?.title || '', category: existing?.category || 'Other',
    amount: existing?.amount || '', expense_date: existing?.expense_date?.split('T')[0] || today,
    description: existing?.description || '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateExpense(existing.id, data) : createExpense(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'}
      subtitle="Record a school expenditure" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          {isEdit ? 'Save Changes' : 'Add Expense'}
        </Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <Input label="Title" required placeholder="e.g. Electricity Bill November" {...f('title')} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" {...f('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Amount (₹)" type="number" min="0" step="0.01" required placeholder="e.g. 5000" {...f('amount')} />
        </div>
        <Input label="Date" type="date" {...f('expense_date')} />
        <Textarea label="Description (optional)" placeholder="Any additional details…" {...f('description')} />
      </div>
    </Modal>
  )
}

export default function Expenses() {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [modal, setModal]       = useState(null)
  const [from, setFrom]         = useState(monthStart)
  const [to, setTo]             = useState(today)
  const [category, setCategory] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', from, to, category],
    queryFn: () => fetchExpenses({ from, to, category: category || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const expenses     = data?.expenses     || []
  const byCategory   = data?.by_category  || []
  const totalExpense = data?.total_expense || 0

  const columns = [
    {
      header: 'Expense', key: 'title',
      render: (_, e) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{e.title}</p>
          {e.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{e.description}</p>}
        </div>
      ),
    },
    { header: 'Category', key: 'category', render: v => <Badge variant={CAT_VARIANT[v] || 'default'}>{v}</Badge> },
    { header: 'Date', key: 'expense_date', render: v => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    {
      header: 'Amount', key: 'amount',
      render: v => <span className="font-semibold text-red-600 dark:text-red-400">₹{parseFloat(v).toLocaleString('en-IN')}</span>,
    },
    { header: 'Recorded By', key: 'recorded_by_name', render: v => <span className="text-xs text-slate-400">{v || '—'}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, e) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(e)}>Edit</Button>
          <Button size="sm" variant="danger" leftIcon={<Trash2 size={12} />}
            onClick={() => { if (confirm(`Delete "${e.title}"?`)) deleteMutation.mutate(e.id) }}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Expenses">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Expenses</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track all school expenditures</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>Add Expense</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shrink-0">
                <TrendingDown size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">₹{totalExpense.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Expenses · {expenses.length} records</p>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <Card>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">By Category</p>
              <div className="flex flex-wrap gap-1.5">
                {byCategory.slice(0, 5).map(c => (
                  <Badge key={c.category} variant={CAT_VARIANT[c.category] || 'default'}>
                    {c.category}: ₹{parseFloat(c.total).toLocaleString('en-IN')}
                  </Badge>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="flex flex-wrap items-end gap-4">
          <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} containerClass="w-40" />
          <Input label="To"   type="date" value={to}   onChange={e => setTo(e.target.value)}   containerClass="w-40" />
          <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} containerClass="w-44">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Card>

        <DataTable columns={columns} data={expenses} loading={isLoading}
          searchKeys={['title', 'category', 'recorded_by_name']} pageSize={12}
          emptyState={<div className="flex flex-col items-center gap-2 py-8 text-slate-400"><Receipt size={32} className="opacity-30" /><p className="text-sm">No expenses recorded</p></div>}
        />

        {modal === 'add' && <ExpenseModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <ExpenseModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}