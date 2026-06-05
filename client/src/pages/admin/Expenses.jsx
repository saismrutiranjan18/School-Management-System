import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExpenses, createExpense,
  updateExpense, deleteExpense,
} from '../../api/expenses.api'
import DashboardLayout from '../../components/DashboardLayout'

const CATEGORIES = [
  'Salaries','Utilities','Maintenance','Stationery',
  'Equipment','Events','Transport','Other',
]

const CAT_COLORS = {
  Salaries:    'bg-blue-50 text-blue-700',
  Utilities:   'bg-yellow-50 text-yellow-700',
  Maintenance: 'bg-orange-50 text-orange-700',
  Stationery:  'bg-green-50 text-green-700',
  Equipment:   'bg-purple-50 text-purple-700',
  Events:      'bg-pink-50 text-pink-700',
  Transport:   'bg-cyan-50 text-cyan-700',
  Other:       'bg-gray-100 text-gray-600',
}

function ExpenseModal({ onClose, existing }) {
  const qc     = useQueryClient()
  const isEdit = !!existing
  const today  = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    title:        existing?.title        || '',
    category:     existing?.category     || 'Other',
    amount:       existing?.amount       || '',
    expense_date: existing?.expense_date?.split('T')[0] || today,
    description:  existing?.description  || '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? updateExpense(existing.id, data)
      : createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Expense' : 'Add Expense'}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Electricity Bill November"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 5000"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Any additional details..."
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Expenses() {
  const qc    = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [modal,    setModal]    = useState(null)
  const [from,     setFrom]     = useState(monthStart)
  const [to,       setTo]       = useState(today)
  const [category, setCategory] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', from, to, category],
    queryFn:  () => fetchExpenses({
      from, to,
      category: category || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['expenses'] }),
    onError:    (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const expenses    = data?.expenses      || []
  const byCategory  = data?.by_category   || []
  const totalExpense = data?.total_expense || 0

  return (
  <DashboardLayout title="Expenses">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all school expenditures</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
          <input
            type="date" value={from}
            onChange={e => setFrom(e.target.value)}
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
          <input
            type="date" value={to}
            onChange={e => setTo(e.target.value)}
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ₹{totalExpense.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-red-400 mt-0.5">{expenses.length} records</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">By Category</p>
          <div className="flex flex-wrap gap-2">
            {byCategory.slice(0, 4).map(c => (
              <span key={c.category}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[c.category] || CAT_COLORS.Other}`}>
                {c.category}: ₹{parseFloat(c.total).toLocaleString('en-IN')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">
          No expenses recorded for this period.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Recorded By</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{exp.title}</p>
                    {exp.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[exp.category] || CAT_COLORS.Other}`}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">
                    ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {exp.recorded_by_name || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(exp)}
                        className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${exp.title}"?`))
                            deleteMutation.mutate(exp.id)
                        }}
                        className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ExpenseModal
          onClose={() => setModal(null)}
          existing={modal === 'add' ? null : modal}
        />
      )}
        </div>
  </DashboardLayout>
)
}