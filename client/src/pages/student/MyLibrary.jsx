import { useSelector }  from 'react-redux'
import { useQuery }     from '@tanstack/react-query'
import { fetchStudentHistory, fetchBooks } from '../../api/library.api'
import api from '../../api/axios'

export default function MyLibrary() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn:  () => api.get('/students').then(r =>
      r.data.find(s => s.email === user?.email)
    ),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-library', studentRecord?.id],
    queryFn:  () => fetchStudentHistory(studentRecord.id),
    enabled:  !!studentRecord?.id,
  })

  const { data: allBooks = [] } = useQuery({
    queryKey: ['books'],
    queryFn:  () => fetchBooks({ available: 'true' }),
  })

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm">Loading library history...</p>
  )

  const active  = data?.records?.filter(r => !r.return_date) || []
  const history = data?.records?.filter(r => r.return_date)  || []

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Library</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your borrowing history and active books</p>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Currently Held',  value: data.summary.currently_held,  color: 'text-blue-600'  },
            { label: 'Total Borrowed',  value: data.summary.total_borrowed,  color: 'text-gray-800'  },
            { label: 'Total Fine',      value: `₹${parseFloat(data.summary.total_fine || 0).toFixed(2)}`, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Currently held books */}
      {active.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Currently Borrowed</h2>
          <div className="space-y-2 mb-6">
            {active.map(rec => {
              const due       = new Date(rec.due_date)
              const today     = new Date()
              const overdue   = today > due
              const daysLeft  = Math.ceil((due - today) / 86400000)

              return (
                <div key={rec.id}
                  className={`bg-white border rounded-xl px-5 py-4 flex items-center justify-between
                    ${overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-200'}`}>
                  <div>
                    <p className="font-medium text-gray-800">{rec.book_title}</p>
                    <p className="text-xs text-gray-400">{rec.book_author} · {rec.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Due:</p>
                    <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                      {new Date(rec.due_date).toLocaleDateString('en-IN')}
                    </p>
                    <p className={`text-xs ${overdue ? 'text-red-500' : 'text-green-600'}`}>
                      {overdue
                        ? `⚠️ ${Math.abs(daysLeft)}d overdue — ₹${(Math.abs(daysLeft) * parseFloat(rec.fine_per_day)).toFixed(2)} fine`
                        : `${daysLeft}d remaining`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Return history */}
      {history.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Return History</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Book</th>
                  <th className="text-left px-5 py-3">Issued</th>
                  <th className="text-left px-5 py-3">Returned</th>
                  <th className="text-right px-5 py-3">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{rec.book_title}</p>
                      <p className="text-xs text-gray-400">{rec.book_author}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(rec.issue_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(rec.return_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {parseFloat(rec.fine_amount) > 0 ? (
                        <span className={`text-sm font-medium ${rec.fine_paid ? 'text-green-600' : 'text-red-500'}`}>
                          ₹{parseFloat(rec.fine_amount).toFixed(2)}
                          {rec.fine_paid ? ' ✓' : ' (pending)'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No fine</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Available books to browse */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Available Books ({allBooks.length})
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {allBooks.slice(0, 8).map(book => (
          <div key={book.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl shrink-0">
              📖
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
              <p className="text-xs text-gray-400 truncate">{book.author}</p>
              <p className="text-xs text-green-600 mt-1">
                {book.available_copies} copies available
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}