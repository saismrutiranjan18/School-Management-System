import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { fetchFinancialReport, downloadFinancialReportPDF } from '../../api/fees.api'
import { triggerPDFDownload } from '../../utils/downloadPDF'

const PIE_COLORS = [
  '#2563eb','#16a34a','#dc2626','#d97706',
  '#7c3aed','#db2777','#0891b2','#64748b',
]

const fmt = (val) =>
  `₹${parseFloat(val || 0).toLocaleString('en-IN')}`

export default function FinancialReport() {
  const today     = new Date().toISOString().split('T')[0]
  const yearStart = today.slice(0, 4) + '-04-01'

  const [from,          setFrom]          = useState(yearStart)
  const [to,            setTo]            = useState(today)
  const [academicYear,  setAcademicYear]  = useState('2024-25')
  const [downloading,   setDownloading]   = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['financial-report', from, to, academicYear],
    queryFn:  () => fetchFinancialReport({
      from, to, academic_year: academicYear,
    }),
  })

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await downloadFinancialReportPDF({
        from, to, academic_year: academicYear,
      })
      triggerPDFDownload(res, `financial-report-${academicYear}.pdf`)
    } catch {
      alert('Failed to download PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const summary  = data?.summary || {}
  const monthly  = data?.monthly || []
  const byType   = data?.collection_by_type   || []
  const byCat    = data?.expense_by_category   || []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Financial Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue vs expenses overview</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {downloading ? 'Generating...' : '⬇ Export PDF'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
          <input
            type="date" value={from}
            onChange={e => setFrom(e.target.value)}
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
          <input
            type="date" value={to}
            onChange={e => setTo(e.target.value)}
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academic Year</label>
          <input
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            placeholder="2024-25"
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm text-center py-16">Loading report...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Total Revenue',
                value: fmt(summary.total_revenue),
                color: 'text-green-600',
                bg:    'bg-green-50 border-green-200',
              },
              {
                label: 'Total Expenses',
                value: fmt(summary.total_expense),
                color: 'text-red-600',
                bg:    'bg-red-50 border-red-200',
              },
              {
                label: 'Net Balance',
                value: fmt(summary.net_balance),
                color: summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600',
                bg:    summary.net_balance >= 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200',
              },
              {
                label: 'Outstanding Dues',
                value: fmt(summary.total_outstanding),
                color: 'text-yellow-600',
                bg:    'bg-yellow-50 border-yellow-200',
              },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly Revenue vs Expense Bar Chart */}
          {monthly.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Monthly Revenue vs Expenses
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={m => {
                      const [y, mo] = m.split('-')
                      return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'short' })
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val, name) => [fmt(val), name]}
                    labelFormatter={m => {
                      const [y, mo] = m.split('-')
                      return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
                    }}
                  />
                  <Legend />
                  <Bar dataKey="collected" name="Revenue"  fill="#16a34a" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses"  name="Expenses" fill="#dc2626" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two pie charts side by side */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Fee collection by type */}
            {byType.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Collection by Fee Type
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="total"
                      nameKey="fee_type"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ fee_type, percent }) =>
                        `${fee_type} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {byType.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [fmt(val), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expenses by category */}
            {byCat.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Expenses by Category
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byCat}
                      dataKey="total"
                      nameKey="category"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {byCat.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [fmt(val), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed breakdown tables */}
          <div className="grid grid-cols-2 gap-6">

            {/* Collection by type */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Fee Collection Breakdown</p>
              </div>
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Fee Type</th>
                    <th className="text-center px-4 py-3">Txns</th>
                    <th className="text-right px-5 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byType.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-800">{row.fee_type}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.transactions}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-600">
                        ₹{parseFloat(row.total).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {byType.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-300 text-xs">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expenses by category */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Expense Breakdown</p>
              </div>
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-center px-4 py-3">Count</th>
                    <th className="text-right px-5 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byCat.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-800">{row.category}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.count}</td>
                      <td className="px-5 py-3 text-right font-semibold text-red-500">
                        ₹{parseFloat(row.total).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {byCat.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-300 text-xs">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}