import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchExams } from '../../api/exams.api'
import { fetchReportCard, downloadReportCardPDF } from '../../api/marks.api'
import api from '../../api/axios'

const GRADE_COLOR = (grade) => {
  if (['A+','A'].includes(grade)) return 'bg-green-100 text-green-700'
  if (['B+','B'].includes(grade)) return 'bg-blue-100 text-blue-700'
  if (grade === 'C')               return 'bg-yellow-100 text-yellow-700'
  if (grade === 'D')               return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-600'
}

export default function MyResults() {
  const { user }     = useSelector(state => state.auth)
  const [examId, setExamId] = useState('')

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn:  () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled:  !!user,
  })

  const { data: exams = [] } = useQuery({
    queryKey: ['exams', studentRecord?.class_id],
    queryFn:  () => fetchExams(studentRecord.class_id),
    enabled:  !!studentRecord?.class_id,
  })

  const publishedExams = exams.filter(e => e.is_published)

  const { data: reportCard, isLoading, error } = useQuery({
    queryKey: ['report-card', studentRecord?.id, examId],
    queryFn:  () => fetchReportCard(studentRecord.id, examId),
    enabled:  !!(studentRecord?.id && examId),
    retry: false,
  })

  const handleDownload = async () => {
    try {
      const response = await downloadReportCardPDF(studentRecord.id, examId)
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `report-card.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      alert('Failed to download PDF.')
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">View your exam results and download report cards</p>
      </div>

      {/* Exam selector */}
      <select value={examId} onChange={e => setExamId(e.target.value)}
        className="mb-6 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select an exam...</option>
        {publishedExams.map(e => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {!examId ? (
        <p className="text-gray-400 text-sm text-center py-16">Select a published exam to view results.</p>
      ) : isLoading ? (
        <p className="text-gray-400 text-sm text-center py-16">Loading results...</p>
      ) : error ? (
        <p className="text-red-500 text-sm text-center py-16">
          {error.response?.data?.error || 'Results not available.'}
        </p>
      ) : reportCard && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Marks',  value: `${reportCard.result.total_obtained} / ${reportCard.result.total_max}` },
              { label: 'Percentage',   value: `${reportCard.result.percentage}%` },
              { label: 'Overall GPA',  value: `${reportCard.result.gpa} / 4.0` },
              { label: 'Class Rank',   value: reportCard.rank ? `#${reportCard.rank}` : '—' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Result badge + Download */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                reportCard.result.result === 'PASS'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {reportCard.result.result}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${GRADE_COLOR(reportCard.result.letter_grade)}`}>
                Grade: {reportCard.result.letter_grade}
              </span>
              <span className="text-sm text-gray-500">{reportCard.result.remark}</span>
            </div>

            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              ⬇ Download Report Card PDF
            </button>
          </div>

          {/* Subject-wise marks table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Subject</th>
                  <th className="text-center px-4 py-3">Max</th>
                  <th className="text-center px-4 py-3">Obtained</th>
                  <th className="text-center px-4 py-3">%</th>
                  <th className="text-center px-4 py-3">Grade</th>
                  <th className="text-center px-4 py-3">GPA</th>
                  <th className="text-center px-4 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportCard.result.subjects.map((sub, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${sub.percentage < 40 && !sub.is_absent ? 'bg-red-50' : ''}`}>
                    <td className="px-5 py-3 font-medium text-gray-800">{sub.subject_name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{sub.max_marks}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {sub.is_absent ? <span className="text-gray-400">AB</span> : sub.marks_obtained}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub.is_absent ? '—' : `${sub.percentage}%`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${GRADE_COLOR(sub.letter_grade)}`}>
                        {sub.letter_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{sub.gpa}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{sub.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}