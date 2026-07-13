import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchExams } from '../../api/exams.api'
import { fetchReportCard, downloadReportCardPDF } from '../../api/marks.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Download, Trophy, Percent, BarChart3, Hash, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const GRADE_VARIANT = (grade) => {
  if (['A+','A'].includes(grade)) return 'success'
  if (['B+','B'].includes(grade)) return 'info'
  if (grade === 'C') return 'warning'
  if (grade === 'D') return 'danger'
  return 'danger'
}

export default function MyResults() {
  const { user } = useSelector(state => state.auth)
  const [examId, setExamId] = useState('')

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled: !!user,
  })

  const { data: exams = [] } = useQuery({
    queryKey: ['exams', studentRecord?.class_id],
    queryFn: () => fetchExams(studentRecord.class_id),
    enabled: !!studentRecord?.class_id,
  })

  const publishedExams = exams.filter(e => e.is_published)

  const { data: reportCard, isLoading, error } = useQuery({
    queryKey: ['report-card', studentRecord?.id, examId],
    queryFn: () => fetchReportCard(studentRecord.id, examId),
    enabled: !!(studentRecord?.id && examId),
    retry: false,
  })

  const handleDownload = async () => {
    try {
      const response = await downloadReportCardPDF(studentRecord.id, examId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-card.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch { alert('Failed to download PDF.') }
  }

  return (
    <DashboardLayout title="My Results">
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">My Results</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View your exam results and download report cards</p>
        </div>

        <Select value={examId} onChange={e => setExamId(e.target.value)} containerClass="max-w-xs">
          <option value="">Select an exam…</option>
          {publishedExams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>

        {!examId ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <FileText size={40} className="opacity-30" />
              <p className="text-sm">Select a published exam to view results</p>
            </div>
          </Card>
        ) : isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading results…</p></Card>
        ) : error ? (
          <Card><p className="text-sm text-red-500 text-center py-12">{error.response?.data?.error || 'Results not available.'}</p></Card>
        ) : reportCard && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Marks', value: `${reportCard.result.total_obtained} / ${reportCard.result.total_max}`, icon: BarChart3, gradient: 'from-violet-500 to-purple-600' },
                { label: 'Percentage',  value: `${reportCard.result.percentage}%`, icon: Percent, gradient: 'from-blue-500 to-indigo-600' },
                { label: 'Overall GPA', value: `${reportCard.result.gpa} / 4.0`,   icon: Trophy,  gradient: 'from-amber-400 to-orange-500' },
                { label: 'Class Rank',  value: reportCard.rank ? `#${reportCard.rank}` : '—', icon: Hash, gradient: 'from-emerald-500 to-teal-600' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                      <s.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Result badge + Download */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={reportCard.result.result === 'PASS' ? 'success' : 'danger'}>{reportCard.result.result}</Badge>
                <Badge variant={GRADE_VARIANT(reportCard.result.letter_grade)}>Grade: {reportCard.result.letter_grade}</Badge>
                <span className="text-sm text-slate-500 dark:text-slate-400">{reportCard.result.remark}</span>
              </div>
              <Button leftIcon={<Download size={14} />} onClick={handleDownload}>Download Report</Button>
            </div>

            {/* Marks table */}
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
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
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {reportCard.result.subjects.map((sub, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${sub.percentage < 40 && !sub.is_absent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{sub.subject_name}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{sub.max_marks}</td>
                        <td className="px-4 py-3 text-center font-medium">
                          {sub.is_absent ? <span className="text-slate-400">AB</span> : sub.marks_obtained}
                        </td>
                        <td className="px-4 py-3 text-center">{sub.is_absent ? '—' : `${sub.percentage}%`}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={GRADE_VARIANT(sub.letter_grade)}>{sub.letter_grade}</Badge></td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{sub.gpa}</td>
                        <td className="px-4 py-3 text-center text-slate-500 text-xs">{sub.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}