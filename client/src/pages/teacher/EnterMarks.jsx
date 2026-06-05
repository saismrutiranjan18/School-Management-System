import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchExams } from '../../api/exams.api'
import { fetchMarksSheet, enterMarks } from '../../api/marks.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'

export default function EnterMarks() {
  const [classId,   setClassId]   = useState('')
  const [examId,    setExamId]    = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [records,   setRecords]   = useState([])
  const [submitted, setSubmitted] = useState(false)

  const { data: classes  = [] } = useQuery({ queryKey: ['classes'],  queryFn: fetchClasses })
  const { data: exams    = [] } = useQuery({
    queryKey: ['exams', classId],
    queryFn:  () => fetchExams(classId),
    enabled:  !!classId,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['class-subjects', classId],
    queryFn:  () => api.get(`/classes/${classId}/subjects`).then(r => r.data),
    enabled:  !!classId,
  })

  const { isLoading: sheetLoading } = useQuery({
    queryKey: ['marks-sheet', examId, subjectId],
    queryFn: async () => {
      const data = await fetchMarksSheet(examId, subjectId)
      setRecords(data.students.map(s => ({
        student_id:     s.student_id,
        name:           s.name,
        roll_no:        s.roll_no,
        marks_obtained: s.marks_obtained,
        max_marks:      s.max_marks,
        is_absent:      s.is_absent,
        remarks:        s.remarks,
      })))
      setSubmitted(data.is_entered)
      return data
    },
    enabled: !!(examId && subjectId),
  })

  const mutation = useMutation({
    mutationFn: enterMarks,
    onSuccess:  () => setSubmitted(true),
  })

  const update = (index, field, value) => {
    setRecords(prev => prev.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    ))
  }

  const handleSubmit = () => {
    mutation.mutate({
      exam_id:    parseInt(examId),
      subject_id: parseInt(subjectId),
      records:    records.map(({ student_id, marks_obtained, max_marks, is_absent, remarks }) => ({
        student_id,
        marks_obtained: is_absent ? 0 : parseFloat(marks_obtained) || 0,
        max_marks:      parseFloat(max_marks) || 100,
        is_absent,
        remarks,
      })),
    })
  }

  const getGradeColor = (obtained, max, absent) => {
    if (absent) return 'text-gray-400'
    const pct = (parseFloat(obtained) / parseFloat(max)) * 100
    if (pct >= 75) return 'text-green-600'
    if (pct >= 50) return 'text-yellow-600'
    if (pct >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  return (
    <DashboardLayout title="Enter Marks">
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Enter Marks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select exam, class, and subject to enter marks</p>
        </div>

      {/* Selectors */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
          <select value={classId}
            onChange={e => { setClassId(e.target.value); setExamId(''); setSubjectId('') }}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exam</label>
          <select value={examId} onChange={e => setExamId(e.target.value)}
            disabled={!classId}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Select exam...</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
            disabled={!classId}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Select subject...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {examId && subjectId && (
        sheetLoading ? (
          <p className="text-gray-400 text-sm py-8 text-center">Loading students...</p>
        ) : records.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No students in this class.</p>
        ) : (
          <>
            {submitted && (
              <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                ✅ Marks already entered. You can update them below.
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 w-16">Roll</th>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-center px-4 py-3 w-28">Max Marks</th>
                    <th className="text-center px-4 py-3 w-28">Marks Obtained</th>
                    <th className="text-center px-4 py-3 w-20">Absent</th>
                    <th className="text-center px-4 py-3 w-16">%</th>
                    <th className="text-left px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((student, i) => {
                    const pct = student.is_absent
                      ? null
                      : student.marks_obtained !== ''
                        ? ((parseFloat(student.marks_obtained) / parseFloat(student.max_marks)) * 100).toFixed(1)
                        : null

                    return (
                      <tr key={student.student_id}
                        className={`hover:bg-gray-50 ${student.is_absent ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3 text-gray-400 text-xs">{student.roll_no || '—'}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{student.name}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number" min="0" max="1000"
                            value={student.max_marks}
                            onChange={e => update(i, 'max_marks', e.target.value)}
                            disabled={student.is_absent}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number" min="0"
                            max={student.max_marks}
                            value={student.marks_obtained}
                            onChange={e => update(i, 'marks_obtained', e.target.value)}
                            disabled={student.is_absent}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={student.is_absent}
                            onChange={e => update(i, 'is_absent', e.target.checked)}
                            className="w-4 h-4 accent-red-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.is_absent ? (
                            <span className="text-xs text-gray-400">AB</span>
                          ) : pct !== null ? (
                            <span className={`text-xs font-semibold ${getGradeColor(student.marks_obtained, student.max_marks, false)}`}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={student.remarks}
                            onChange={e => update(i, 'remarks', e.target.value)}
                            placeholder="Optional..."
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleSubmit} disabled={mutation.isPending}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {mutation.isPending ? 'Saving...' : submitted ? 'Update Marks' : 'Submit Marks'}
              </button>
              {mutation.isSuccess && (
                <span className="text-sm text-green-600">✅ Marks saved successfully.</span>
              )}
              {mutation.isError && (
                <span className="text-sm text-red-500">
                  ❌ {mutation.error?.response?.data?.error || 'Failed to save.'}
                </span>
              )}
            </div>
          </>
        )
      )}
        </div>
  </DashboardLayout>
)
}