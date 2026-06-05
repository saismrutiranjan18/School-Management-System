import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchExams, createExam, updateExam, deleteExam } from '../../api/exams.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'

function ExamModal({ onClose, existing }) {
  const qc     = useQueryClient()
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
    onError:   (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Exam' : 'Schedule Exam'}</h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Exam Name</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mid-Term Exam 2024"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Class</label>
            <select
              value={form.class_id}
              onChange={e => setForm({ ...form, class_id: e.target.value })}
              required
              disabled={isEdit}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish"
                checked={form.is_published}
                onChange={e => setForm({ ...form, is_published: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="publish" className="text-sm text-gray-700">
                Publish results (students can view report cards)
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EXAM_TYPE_COLOR = (name) => {
  const n = name.toLowerCase()
  if (n.includes('mid'))    return 'bg-blue-50 text-blue-700'
  if (n.includes('final'))  return 'bg-red-50 text-red-700'
  if (n.includes('unit'))   return 'bg-green-50 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

export default function Exams() {
  const qc = useQueryClient()
  const [modal,    setModal]    = useState(null)
  const [filterClass, setFilterClass] = useState('')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', filterClass],
    queryFn:  () => fetchExams(filterClass || undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['exams'] }),
    onError:    (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  return (
  <DashboardLayout title="Exams">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Exams</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and manage all examinations</p>
        </div>
        <button onClick={() => setModal('add')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Schedule Exam
        </button>
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
        <p className="text-gray-400 text-sm">Loading exams...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {exams.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">No exams scheduled yet.</p>
          )}
          {exams.map(exam => (
            <div key={exam.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXAM_TYPE_COLOR(exam.name)}`}>
                  {exam.name}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {exam.class_name} — {exam.section}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(exam.start_date).toLocaleDateString('en-IN')} →{' '}
                    {new Date(exam.end_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  exam.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {exam.is_published ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => setModal(exam)}
                  className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Edit
                </button>
                <button
                  onClick={() => { if (confirm('Delete this exam?')) deleteMutation.mutate(exam.id) }}
                  className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExamModal onClose={() => setModal(null)} existing={modal === 'add' ? null : modal} />
      )}
        </div>
  </DashboardLayout>
)
}