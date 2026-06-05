import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchAttendanceSheet, markAttendance } from '../../api/attendance.api'
import api from '../../api/axios'
import { useSelector } from 'react-redux'
import DashboardLayout from '../../components/DashboardLayout'

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700 border-green-300',
  absent:  'bg-red-100  text-red-700  border-red-300',
  late:    'bg-yellow-100 text-yellow-700 border-yellow-300',
}

const STATUS_OPTIONS = ['present', 'absent', 'late']

export default function MarkAttendance() {
  const { user } = useSelector(state => state.auth)
  const today = new Date().toISOString().split('T')[0]

  const [classId,   setClassId]   = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date,      setDate]      = useState(today)
  const [records,   setRecords]   = useState([])
  const [submitted, setSubmitted] = useState(false)

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  // Fetch subjects for selected class
  const { data: subjects = [] } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn: () => api.get(`/classes/${classId}/subjects`).then(r => r.data),
    enabled: !!classId,
  })

  // Fetch teacher record
  const { data: teacherRecord } = useQuery({
    queryKey: ['my-teacher-record', user?.id],
    queryFn: () => api.get('/teachers').then(r =>
      r.data.find(t => t.email === user?.email)
    ),
    enabled: !!user,
  })

  // Fetch attendance sheet when all three selected
  const { isLoading: sheetLoading } = useQuery({
    queryKey: ['attendance-sheet', classId, subjectId, date],
    queryFn: async () => {
      const data = await fetchAttendanceSheet(classId, subjectId, date)
      setRecords(data.students.map(s => ({
        student_id: s.student_id,
        name:       s.name,
        roll_no:    s.roll_no,
        status:     s.status,
        remarks:    s.remarks,
      })))
      setSubmitted(data.is_marked)
      return data
    },
    enabled: !!(classId && subjectId && date),
  })

  const mutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => setSubmitted(true),
  })

  const setStatus = (index, status) => {
    setRecords(prev => prev.map((r, i) => i === index ? { ...r, status } : r))
  }

  const markAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })))
  }

  const handleSubmit = () => {
    if (!teacherRecord) return
    mutation.mutate({
      class_id:   parseInt(classId),
      subject_id: parseInt(subjectId),
      teacher_id: teacherRecord.id,
      date,
      records:    records.map(({ student_id, status, remarks }) =>
                    ({ student_id, status, remarks })
                  ),
    })
  }

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount  = records.filter(r => r.status === 'absent').length
  const lateCount    = records.filter(r => r.status === 'late').length

  return (
    <DashboardLayout title="Mark Attendance">
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Mark Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select class, subject, and date to begin</p>
        </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
          <select
            value={classId}
            onChange={e => { setClassId(e.target.value); setSubjectId('') }}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            disabled={!classId}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select subject...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ready to mark */}
      {classId && subjectId && date && (
        <>
          {sheetLoading ? (
            <p className="text-gray-400 text-sm py-8 text-center">Loading students...</p>
          ) : records.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              No students found in this class.
            </p>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Present', count: presentCount, color: 'text-green-600 bg-green-50 border-green-200' },
                  { label: 'Absent',  count: absentCount,  color: 'text-red-600   bg-red-50   border-red-200'   },
                  { label: 'Late',    count: lateCount,    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
                    <p className="text-xs font-medium">{s.label}</p>
                    <p className="text-2xl font-semibold">{s.count}</p>
                  </div>
                ))}
              </div>

              {/* Mark all buttons */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 mr-1">Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => markAll(s)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium capitalize ${STATUS_STYLES[s]}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Already marked banner */}
              {submitted && (
                <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                  ✅ Attendance already marked for this session. You can still update it.
                </div>
              )}

              {/* Student list */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3 w-16">Roll</th>
                      <th className="text-left px-5 py-3">Student Name</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((student, index) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {student.roll_no || '—'}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {student.name}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s}
                                onClick={() => setStatus(index, s)}
                                className={`
                                  px-3 py-1 text-xs rounded-full border font-medium capitalize
                                  transition-all
                                  ${student.status === s
                                    ? STATUS_STYLES[s]
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}
                                `}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <input
                            value={student.remarks}
                            onChange={e => setRecords(prev =>
                              prev.map((r, i) =>
                                i === index ? { ...r, remarks: e.target.value } : r
                              )
                            )}
                            placeholder="Optional note..."
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={mutation.isPending}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {mutation.isPending
                    ? 'Saving...'
                    : submitted
                      ? 'Update Attendance'
                      : 'Submit Attendance'}
                </button>

                {mutation.isSuccess && (
                  <span className="text-sm text-green-600">
                    ✅ Attendance saved! Absence alerts sent via email.
                  </span>
                )}
                {mutation.isError && (
                  <span className="text-sm text-red-500">
                    ❌ {mutation.error?.response?.data?.error || 'Failed to save.'}
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}
        </div>
  </DashboardLayout>
)
}