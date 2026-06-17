import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOutstandingDues } from '../../api/fees.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'

const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  check: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3'],
  dues:  ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
}

export default function OutstandingDues() {
  const [filterClass, setFilterClass] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn:  fetchClasses,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['outstanding', filterClass],
    queryFn:  () => fetchOutstandingDues({ class_id: filterClass || undefined }),
  })

  return (
    <DashboardLayout title="Outstanding Dues">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Outstanding Dues</h1>
          <p className="text-sm text-gray-500 mt-0.5">Students with pending fee balance</p>
        </div>

        {data && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ₹{parseFloat(data.total_outstanding).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Students with Dues</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{data.count}</p>
            </div>
          </div>
        )}

        <select
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
          className="mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
          ))}
        </select>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Class</th>
                  <th className="text-right px-5 py-3">Total Due</th>
                  <th className="text-right px-5 py-3">Paid</th>
                  <th className="text-right px-5 py-3">Balance</th>
                  <th className="text-center px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.students?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Icon d={ICONS.check} size={36} className="text-green-400" />
                        <span className="text-sm">No outstanding dues!</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.students?.map(s => (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">Roll: {s.roll_no || '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {s.class_name} — {s.section}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        ₹{s.total_due.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-right text-green-600">
                        ₹{s.total_paid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-red-500">
                        ₹{s.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                          ${s.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}