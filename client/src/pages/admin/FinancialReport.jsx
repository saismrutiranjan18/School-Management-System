import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { fetchFinancialReport, downloadFinancialReportPDF } from '../../api/fees.api'
import { triggerPDFDownload } from '../../utils/downloadPDF'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import { Download, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const PIE_COLORS = ['#7c3aed','#2563eb','#16a34a','#dc2626','#d97706','#db2777','#0891b2','#64748b']
const fmt = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`

export default function FinancialReport() {
  const { darkMode } = useTheme()
  const today     = new Date().toISOString().split('T')[0]
  const yearStart = today.slice(0, 4) + '-04-01'

  const [from, setFrom]                 = useState(yearStart)
  const [to, setTo]                     = useState(today)
  const [academicYear, setAcademicYear] = useState('2024-25')
  const [downloading, setDownloading]   = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['financial-report', from, to, academicYear],
    queryFn: () => fetchFinancialReport({ from, to, academic_year: academicYear }),
  })

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await downloadFinancialReportPDF({ from, to, academic_year: academicYear })
      triggerPDFDownload(res, `financial-report-${academicYear}.pdf`)
    } catch { alert('Failed to download PDF.') }
    finally { setDownloading(false) }
  }

  const summary = data?.summary || {}
  const monthly = data?.monthly || []
  const byType  = data?.collection_by_type || []
  const byCat   = data?.expense_by_category || []

  const axisColor = darkMode ? '#64748b' : '#94a3b8'
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9'

  return (
    <DashboardLayout title="Financial Report">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Financial Report</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Revenue vs expenses overview</p>
          </div>
          <Button leftIcon={<Download size={15} />} loading={downloading} onClick={handleDownloadPDF}>
            Export PDF
          </Button>
        </div>

        {/* Filters */}
        <Card className="flex flex-wrap items-end gap-4">
          <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} containerClass="w-40" />
          <Input label="To"   type="date" value={to}   onChange={e => setTo(e.target.value)}   containerClass="w-40" />
          <Input label="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2024-25" containerClass="w-32" />
        </Card>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-16">Loading report…</p></Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue',    value: fmt(summary.total_revenue),    icon: TrendingUp,    gradient: 'from-emerald-500 to-teal-600'   },
                { label: 'Total Expenses',   value: fmt(summary.total_expense),    icon: TrendingDown,  gradient: 'from-red-400 to-rose-600'       },
                { label: 'Net Balance',      value: fmt(summary.net_balance),      icon: DollarSign,    gradient: summary.net_balance >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-400 to-rose-600' },
                { label: 'Outstanding Dues', value: fmt(summary.total_outstanding),icon: AlertTriangle, gradient: 'from-amber-400 to-orange-500'   },
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

            {/* Monthly Revenue vs Expense */}
            {monthly.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Monthly Revenue vs Expenses</CardTitle></CardHeader>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }}
                      tickFormatter={m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'short' }) }} />
                    <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', background: darkMode ? '#1e293b' : '#fff' }}
                      formatter={(val, name) => [fmt(val), name]}
                      labelFormatter={m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' }) }} />
                    <Legend />
                    <Bar dataKey="collected" name="Revenue"  fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses"  name="Expenses" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Pie charts */}
            <div className="grid grid-cols-2 gap-6">
              {byType.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Collection by Fee Type</CardTitle></CardHeader>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byType} dataKey="total" nameKey="fee_type" cx="50%" cy="50%" outerRadius={85}
                        label={({ fee_type, percent }) => `${fee_type} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val) => [fmt(val), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {byCat.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byCat} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={85}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {byCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val) => [fmt(val), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Breakdown tables */}
            <div className="grid grid-cols-2 gap-6">
              <Card padding="none">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fee Collection Breakdown</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Fee Type</th>
                      <th className="text-center px-4 py-3">Txns</th>
                      <th className="text-right px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {byType.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-6 text-slate-300 dark:text-slate-600 text-xs">No data</td></tr>
                    ) : byType.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3 text-slate-800 dark:text-slate-200">{row.fee_type}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{row.transactions}</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">₹{parseFloat(row.total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card padding="none">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Expense Breakdown</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Category</th>
                      <th className="text-center px-4 py-3">Count</th>
                      <th className="text-right px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {byCat.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-6 text-slate-300 dark:text-slate-600 text-xs">No data</td></tr>
                    ) : byCat.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3 text-slate-800 dark:text-slate-200">{row.category}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{row.count}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-500 dark:text-red-400">₹{parseFloat(row.total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}