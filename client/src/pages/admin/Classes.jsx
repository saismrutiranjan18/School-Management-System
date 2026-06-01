import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses, createClass, updateClass, deleteClass } from '../../api/classes.api'
import api from '../../api/axios'

// ── Modal ──────────────────────────────────────────────────────────────
function ClassModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing

  const [form, setForm] = useState({
    name:             existing?.name            || '',
    section:          existing?.section         || '',
    academic_year:    existing?.academic_year   || '2024-25',
    class_teacher_id: existing?.class_teacher_id || '',
  })
  const [error, setError] = useState('')

  // fetch teachers for dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateClass(existing.id, data) : createClass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Class' : 'Add New Class'}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Class Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Class 10"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Section</label>
              <input
                value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}
                placeholder="e.g. A"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Academic Year</label>
            <input
              value={form.academic_year}
              onChange={e => setForm({ ...form, academic_year: e.target.value })}
              placeholder="2024-25"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Class Teacher (optional)</label>
            <select
              value={form.class_teacher_id}
              onChange={e => setForm({ ...form, class_teacher_id: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Classes() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'add' | { ...classObj }
  const [search, setSearch] = useState('')

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const filtered = classes.filter(c =>
    `${c.name} ${c.section}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all classes and sections</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Class
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search classes..."
        className="mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Classes', value: classes.length },
          { label: 'Total Students', value: classes.reduce((a, c) => a + parseInt(c.student_count || 0), 0) },
          { label: 'Academic Year', value: classes[0]?.academic_year || '2024-25' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading classes...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Class</th>
                <th className="text-left px-5 py-3">Section</th>
                <th className="text-left px-5 py-3">Class Teacher</th>
                <th className="text-left px-5 py-3">Students</th>
                <th className="text-left px-5 py-3">Academic Year</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No classes found.
                  </td>
                </tr>
              ) : (
                filtered.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{cls.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {cls.section}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {cls.class_teacher_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{cls.student_count}</td>
                    <td className="px-5 py-3 text-gray-600">{cls.academic_year}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(cls)}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${cls.name} - ${cls.section}?`))
                              deleteMutation.mutate(cls.id)
                          }}
                          className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ClassModal
          onClose={() => setModal(null)}
          existing={modal === 'add' ? null : modal}
        />
      )}
    </div>
  )
}