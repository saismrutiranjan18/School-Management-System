import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  fetchAnnouncements,
  createAnnouncement,
} from '../../api/announcements.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  low:    'bg-gray-100 text-gray-500 border-gray-200',
}

export default function TeacherAnnouncements() {
  const qc          = useQueryClient()
  const { user }    = useSelector(state => state.auth)
  const [showForm,  setShowForm]  = useState(false)
  const [form, setForm] = useState({
    title: '', body: '', target_role: 'student',
    target_class: '', priority: 'normal', send_email: false,
  })
  const [error, setError] = useState('')

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn:  fetchAnnouncements,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn:  fetchClasses,
  })

  const mutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowForm(false)
      setForm({ title: '', body: '', target_role: 'student', target_class: '', priority: 'normal', send_email: false })
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to post.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({ ...form, target_class: form.target_class || null })
  }

  return (
     <DashboardLayout title="Announcements">
       <div className="p-6 max-w-3xl">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-semibold text-gray-800">Announcements</h1>
             <p className="text-sm text-gray-500 mt-0.5">View notices and post class announcements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Post Notice'}
        </button>
      </div>

      {/* Quick post form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Post a Notice</h2>
          {error && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Notice title..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Write your notice here..."
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <select
                value={form.target_role}
                onChange={e => setForm({ ...form, target_role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Students</option>
                <option value="parent">Parents</option>
                <option value="all">Everyone</option>
              </select>
              <select
                value={form.target_class}
                onChange={e => setForm({ ...form, target_class: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="te_send_email"
                checked={form.send_email}
                onChange={e => setForm({ ...form, send_email: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="te_send_email" className="text-sm text-gray-600">
                Send email notification
              </label>
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Posting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      {/* Announcements list */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id}
              className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-gray-800">{ann.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[ann.priority]}`}>
                      {ann.priority}
                    </span>
                    {ann.class_name && (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                        {ann.class_name} {ann.class_section}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {ann.created_by_name} · {new Date(ann.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
  </DashboardLayout>
)
}