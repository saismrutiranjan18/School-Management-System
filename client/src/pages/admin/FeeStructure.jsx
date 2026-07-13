import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure } from '../../api/fees.api'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import { DollarSign, Plus, Pencil, Trash2, AlertCircle, Layers, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const FEE_TYPES   = ['Tuition Fee','Admission Fee','Library Fee','Transport Fee','Sports Fee','Lab Fee','Exam Fee','Other']
const FREQUENCIES = ['monthly','quarterly','yearly','one-time']

const FREQ_VARIANT = { monthly: 'info', quarterly: 'purple', yearly: 'success', 'one-time': 'warning' }

function ErrorAlert({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="shrink-0" />{msg}
    </div>
  )
}

function FeeStructureModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    class_id: existing?.class_id || '', fee_type: existing?.fee_type || '',
    amount: existing?.amount || '', frequency: existing?.frequency || 'monthly',
    academic_year: existing?.academic_year || '2024-25', description: existing?.description || '',
  })
  const [error, setError] = useState('')
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateFeeStructure(existing.id, data) : createFeeStructure(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-structures'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}
      subtitle="Define fee type and amount for a class" size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(form) }}>
          {isEdit ? 'Save Changes' : 'Add Fee Type'}
        </Button>
      </>}
    >
      <ErrorAlert msg={error} />
      <div className="space-y-3">
        <Select label="Class" required disabled={isEdit} {...f('class_id')}>
          <option value="">Select class…</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Fee Type" required {...f('fee_type')}>
            <option value="">Select type…</option>
            {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Frequency" {...f('frequency')}>
            {FREQUENCIES.map(fr => <option key={fr} value={fr}>{fr}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (₹)" type="number" min="0" step="0.01" required placeholder="e.g. 2000" {...f('amount')} />
          <Input label="Academic Year" placeholder="2024-25" {...f('academic_year')} />
        </div>
        <Input label="Description (optional)" placeholder="Any notes…" {...f('description')} />
      </div>
    </Modal>
  )
}

export default function FeeStructure() {
  const qc = useQueryClient()
  const [modal, setModal]           = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: classes = [] }               = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['fee-structures', filterClass],
    queryFn: () => fetchFeeStructures({ class_id: filterClass || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-structures'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const grouped = structures.reduce((acc, s) => {
    const key = `${s.class_name} — ${s.section}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const totalAnnual = structures.reduce((sum, s) => {
    const multiplier = { monthly: 12, quarterly: 4, yearly: 1, 'one-time': 1 }
    return sum + parseFloat(s.amount) * (multiplier[s.frequency] || 1)
  }, 0)

  return (
    <DashboardLayout title="Fee Structure">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Fee Structure</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Define fee types and amounts per class</p>
          </div>
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal('add')}>Add Fee Type</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Fee Types',    value: structures.length,                 icon: Layers,    gradient: 'from-violet-500 to-purple-600' },
            { label: 'Classes Configured', value: Object.keys(grouped).length,       icon: Building2, gradient: 'from-blue-500 to-indigo-600'   },
            { label: 'Avg Annual Fee',     value: structures.length ? `₹${(totalAnnual / Math.max(Object.keys(grouped).length, 1)).toLocaleString('en-IN')}` : '₹0', icon: DollarSign, gradient: 'from-emerald-500 to-teal-600' },
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

        {/* Filter */}
        <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} containerClass="max-w-xs">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
        </Select>

        {/* Grouped tables */}
        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card>
        ) : structures.length === 0 ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">No fee structures defined yet.</p></Card>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([className, fees]) => (
              <Card key={className} padding="none">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{className}</p>
                  <span className="text-xs text-slate-400">{fees.length} fee type(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Fee Type</th>
                        <th className="text-left px-5 py-3">Frequency</th>
                        <th className="text-right px-5 py-3">Amount</th>
                        <th className="text-left px-5 py-3">Description</th>
                        <th className="text-left px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {fees.map(fee => (
                        <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{fee.fee_type}</td>
                          <td className="px-5 py-3">
                            <Badge variant={FREQ_VARIANT[fee.frequency] || 'default'}>{fee.frequency}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                            ₹{parseFloat(fee.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{fee.description || '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" leftIcon={<Pencil size={12} />} onClick={() => setModal(fee)}>Edit</Button>
                              <Button size="sm" variant="danger" leftIcon={<Trash2 size={12} />}
                                onClick={() => { if (confirm(`Delete "${fee.fee_type}" for ${className}?`)) deleteMutation.mutate(fee.id) }}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}

        {modal === 'add' && <FeeStructureModal onClose={() => setModal(null)} />}
        {modal && modal !== 'add' && <FeeStructureModal existing={modal} onClose={() => setModal(null)} />}
      </div>
    </DashboardLayout>
  )
}