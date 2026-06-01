import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects.api'
import { fetchClasses } from '../../api/classes.api'
import api from '../../api/axios'

function SubjectModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing

  const [form, setForm] = useState({
    name:       existing?.name       || '',
    code:       existing?.code       || '',
    class_id:   existing?.class_id   || '',
    teacher_id: existing?.teacher_id || '',
  })
  const [error, setError] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateSubject(existing.id, data) : createSubject(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
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
          {isEdit ? 'Edit Subject' : 'Add New Subject'}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Subject Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mathematics"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Subject Code</label>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MATH10"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Class</label>
            <select
              value={form.class_id}
              onChange={e => setForm({ ...form, class_id: e.target.value })}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Assign Teacher (optional)</label>
            <select
              value={form.teacher_id}
              onChange={e => setForm({ ...form, teacher_id: e.target.value })}
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

export default function Subjects() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const filtered = subjects.filter(s =>
    filterClass ? String(s.class_id) === filterClass : true
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Subjects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage subjects and assign teachers</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Subject
        </button>
      </div>

      {/* Filter by class */}
      <select
        value={filterClass}
        onChange={e => setFilterClass(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Classes</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
        ))}
      </select>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading subjects...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Subject</th>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Class</th>
                <th className="text-left px-5 py-3">Teacher</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No subjects found.
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{sub.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        {sub.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {sub.class_name} - {sub.section}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {sub.teacher_name || <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(sub)}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete subject ${sub.name}?`))
                              deleteMutation.mutate(sub.id)
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

      {modal && (
        <SubjectModal
          onClose={() => setModal(null)}
          existing={modal === 'add' ? null : modal}
        />
      )}
    </div>
  )
}