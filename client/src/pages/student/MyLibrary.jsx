import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentHistory, fetchBooks } from '../../api/library.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { BookOpen, Clock, AlertTriangle, CheckCircle2, Library, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MyLibrary() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-library', studentRecord?.id],
    queryFn: () => fetchStudentHistory(studentRecord.id),
    enabled: !!studentRecord?.id,
  })

  const { data: allBooks = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => fetchBooks({ available: 'true' }),
  })

  const active = data?.records?.filter(r => !r.return_date) || []
  const history = data?.records?.filter(r => r.return_date) || []

  return (
    <DashboardLayout title="Library">
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Library</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your borrowing history and active books</p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading library history…</p></Card>
        ) : (
          <>
            {/* Summary */}
            {data?.summary && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Currently Held', value: data.summary.currently_held || 0, icon: BookOpen, gradient: 'from-blue-500 to-indigo-600' },
                  { label: 'Total Borrowed', value: data.summary.total_borrowed || 0, icon: Library, gradient: 'from-violet-500 to-purple-600' },
                  { label: 'Total Fine', value: `₹${parseFloat(data.summary.total_fine || 0).toFixed(2)}`, icon: DollarSign, gradient: 'from-red-400 to-rose-600' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                        <s.icon size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Currently borrowed */}
            {active.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Currently Borrowed</h2>
                <div className="space-y-3">
                  {active.map(rec => {
                    const due = new Date(rec.due_date)
                    const today = new Date()
                    const overdue = today > due
                    const daysLeft = Math.ceil((due - today) / 86400000)

                    return (
                      <Card key={rec.id} className={`flex items-center justify-between ${overdue ? '!border-red-200 dark:!border-red-800/40' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-12 rounded-xl flex items-center justify-center shrink-0
                            ${overdue ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{rec.book_title}</p>
                            <p className="text-xs text-slate-400">{rec.book_author} · {rec.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Due:</p>
                          <p className={`text-sm font-semibold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {due.toLocaleDateString('en-IN')}
                          </p>
                          <div className={`flex items-center gap-1 justify-end text-xs mt-0.5 ${overdue ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {overdue ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                            <span>{overdue ? `${Math.abs(daysLeft)}d overdue — ₹${(Math.abs(daysLeft) * parseFloat(rec.fine_per_day)).toFixed(2)} fine` : `${daysLeft}d remaining`}</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}

            {/* Return history */}
            {history.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Return History</h2>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-5 py-3">Book</th>
                          <th className="text-left px-5 py-3">Issued</th>
                          <th className="text-left px-5 py-3">Returned</th>
                          <th className="text-right px-5 py-3">Fine</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {history.map(rec => (
                          <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-800 dark:text-slate-100">{rec.book_title}</p>
                              <p className="text-xs text-slate-400">{rec.book_author}</p>
                            </td>
                            <td className="px-5 py-3 text-slate-500">{new Date(rec.issue_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3 text-slate-500">{new Date(rec.return_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3 text-right">
                              {parseFloat(rec.fine_amount) > 0 ? (
                                <span className={`text-sm font-medium ${rec.fine_paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                  ₹{parseFloat(rec.fine_amount).toFixed(2)} {rec.fine_paid ? '✓' : '(pending)'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">No fine</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}

            {/* Available books */}
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Available Books ({allBooks.length})</h2>
            <div className="grid grid-cols-2 gap-3">
              {allBooks.slice(0, 8).map(book => (
                <Card key={book.id} className="flex items-start gap-3">
                  <div className="w-10 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
                    <p className="text-xs text-slate-400 truncate">{book.author}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{book.available_copies} copies available</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}