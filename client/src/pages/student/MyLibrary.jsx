import { useSelector }  from 'react-redux'
import { useQuery }     from '@tanstack/react-query'
import { fetchStudentHistory, fetchBooks } from '../../api/library.api'
import api from '../../api/axios'

const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  book:     ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  books:    ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  clock:    ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 6v6l4 2'],
  warning:  ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'],
  check:    ['M20 6 9 17l-5-5'],
  fine:     ['M12 2v20','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  held:     ['M9 12l2 2 4-4','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
  borrowed: ['M8 6h13','M8 12h13','M8 18h13','M3 6h.01','M3 12h.01','M3 18h.01'],
}

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
    <p className="p-8 text-gray-400 text-sm">Loading library history…</p>
  )

  const active  = data?.records?.filter(r => !r.return_date) || []
  const history = data?.records?.filter(r =>  r.return_date) || []

  const summaryCards = [
    { label: 'Currently Held', value: data?.summary?.currently_held || 0, iconKey: 'held',     color: 'text-blue-600',  bg: 'bg-blue-50  text-blue-600'  },
    { label: 'Total Borrowed', value: data?.summary?.total_borrowed  || 0, iconKey: 'borrowed', color: 'text-gray-800',  bg: 'bg-gray-100 text-gray-600'  },
    { label: 'Total Fine',     value: `₹${parseFloat(data?.summary?.total_fine || 0).toFixed(2)}`,
      iconKey: 'fine', color: 'text-red-600', bg: 'bg-red-50 text-red-500' },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Library</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your borrowing history and active books</p>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {summaryCards.map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center
                               justify-center ${s.bg}`}>
                <Icon d={ICONS[s.iconKey]} size={18} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
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
              const due      = new Date(rec.due_date)
              const today    = new Date()
              const overdue  = today > due
              const daysLeft = Math.ceil((due - today) / 86400000)

              return (
                <div key={rec.id}
                  className={`bg-white border rounded-xl px-5 py-4 flex items-center justify-between
                    ${overdue ? 'border-red-200 bg-red-50/20' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-12 rounded-lg flex items-center justify-center shrink-0
                                     ${overdue ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                      <Icon d={ICONS.book} size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{rec.book_title}</p>
                      <p className="text-xs text-gray-400">{rec.book_author} · {rec.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Due:</p>
                    <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                      {new Date(rec.due_date).toLocaleDateString('en-IN')}
                    </p>
                    <div className={`flex items-center gap-1 justify-end text-xs mt-0.5
                                     ${overdue ? 'text-red-500' : 'text-green-600'}`}>
                      <Icon d={overdue ? ICONS.warning : ICONS.check} size={12} />
                      <span>
                        {overdue
                          ? `${Math.abs(daysLeft)}d overdue — ₹${(Math.abs(daysLeft) * parseFloat(rec.fine_per_day)).toFixed(2)} fine`
                          : `${daysLeft}d remaining`}
                      </span>
                    </div>
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
                        <span className={`text-sm font-medium
                          ${rec.fine_paid ? 'text-green-600' : 'text-red-500'}`}>
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

      {/* Available books */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Available Books ({allBooks.length})
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {allBooks.slice(0, 8).map(book => (
          <div key={book.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center
                            justify-center shrink-0">
              <Icon d={ICONS.book} size={20} />
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