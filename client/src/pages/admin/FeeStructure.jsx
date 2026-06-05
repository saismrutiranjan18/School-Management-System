import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import {
  fetchFeeStructures, createFeeStructure,
  updateFeeStructure, deleteFeeStructure,
} from '../../api/fees.api'
import DashboardLayout from '../../components/DashboardLayout'

const FEE_TYPES      = ['Tuition Fee','Admission Fee','Library Fee','Transport Fee','Sports Fee','Lab Fee','Exam Fee','Other']
const FREQUENCIES    = ['monthly','quarterly','yearly','one-time']
const FREQ_BADGE     = {
  monthly:    'bg-blue-50 text-blue-700',
  quarterly:  'bg-purple-50 text-purple-700',
  yearly:     'bg-green-50 text-green-700',
  'one-time': 'bg-yellow-50 text-yellow-700',
}

function FeeStructureModal({ onClose, existing }) {
  const qc     = useQueryClient()
  const isEdit = !!existing

  const [form, setForm] = useState({
    class_id:      existing?.class_id      || '',
    fee_type:      existing?.fee_type      || '',
    amount:        existing?.amount        || '',
    frequency:     existing?.frequency     || 'monthly',
    academic_year: existing?.academic_year || '2024-25',
    description:   existing?.description   || '',
  })
  const [error, setError] = useState('')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateFeeStructure(existing.id, data)
      : createFeeStructure(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-structures'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Class</label>
            <select value={form.class_id}
              onChange={e => setForm({ ...form, class_id: e.target.value })}
              required disabled={isEdit}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              <option value="">Select class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Fee Type</label>
              <select value={form.fee_type}
                onChange={e => setForm({ ...form, fee_type: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type...</option>
                {FEE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Frequency</label>
              <select value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
              <input type="number" min="0" step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 2000"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Academic Year</label>
              <input value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                placeholder="2024-25"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <input value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Any notes..."
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FeeStructure() {
  const qc = useQueryClient()
  const [modal,       setModal]       = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['fee-structures', filterClass],
    queryFn:  () => fetchFeeStructures({ class_id: filterClass || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['fee-structures'] }),
    onError:    (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  // Group by class for display
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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Fee Structure</h1>
            <p className="text-sm text-gray-500 mt-0.5">Define fee types and amounts per class</p>
        </div>
        <button onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Add Fee Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Fee Types',     value: structures.length },
          { label: 'Classes Configured',  value: Object.keys(grouped).length },
          { label: 'Avg Annual Fee',
            value: structures.length
              ? `₹${(totalAnnual / Math.max(Object.keys(grouped).length,1)).toLocaleString('en-IN')}`
              : '₹0' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Classes</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
        ))}
      </select>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : structures.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">
          No fee structures defined yet. Click "+ Add Fee Type" to start.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([className, fees]) => (
            <div key={className} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <p className="font-semibold text-gray-700 text-sm">{className}</p>
                <p className="text-xs text-gray-400">{fees.length} fee type(s)</p>
              </div>
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Fee Type</th>
                    <th className="text-left px-5 py-3">Frequency</th>
                    <th className="text-right px-5 py-3">Amount</th>
                    <th className="text-left px-5 py-3">Description</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.map(fee => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{fee.fee_type}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FREQ_BADGE[fee.frequency]}`}>
                          {fee.frequency}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">
                        ₹{parseFloat(fee.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {fee.description || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setModal(fee)}
                            className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${fee.fee_type}" for ${className}?`))
                                deleteMutation.mutate(fee.id)
                            }}
                            className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <FeeStructureModal
          onClose={() => setModal(null)}
          existing={modal === 'add' ? null : modal}
        />
      )}
       </div>
  </DashboardLayout>
)
}