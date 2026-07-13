import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOutstandingDues } from '../../api/fees.api'
import { fetchClasses } from '../../api/classes.api'
import DashboardLayout from '../../components/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import { Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { AlertTriangle, DollarSign, Users, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OutstandingDues() {
  const [filterClass, setFilterClass] = useState('')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data, isLoading } = useQuery({
    queryKey: ['outstanding', filterClass],
    queryFn: () => fetchOutstandingDues({ class_id: filterClass || undefined }),
  })

  const students = data?.students || []
  const total    = parseFloat(data?.total_outstanding || 0)
  const count    = data?.count || 0

  const columns = [
    {
      header: 'Student', key: 'name',
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {s.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
            <p className="text-xs text-slate-400">Roll: {s.roll_no || '—'}</p>
          </div>
        </div>
      ),
    },
    { header: 'Class', key: 'class_name', render: (_, s) => `${s.class_name} — ${s.section}` },
    {
      header: 'Total Due', key: 'total_due',
      render: v => <span className="text-slate-700 dark:text-slate-300">₹{v.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Paid', key: 'total_paid',
      render: v => <span className="text-emerald-600 dark:text-emerald-400 font-medium">₹{v.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Balance', key: 'balance',
      render: v => <span className="text-red-600 dark:text-red-400 font-bold">₹{v.toLocaleString('en-IN')}</span>,
    },
    { header: 'Status', key: 'status', sortable: false, render: v => <StatusBadge status={v} /> },
  ]

  return (
    <DashboardLayout title="Outstanding Dues">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Outstanding Dues</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Students with pending fee balance</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Outstanding', value: `₹${total.toLocaleString('en-IN')}`, icon: DollarSign, gradient: 'from-red-400 to-rose-600' },
            { label: 'Students with Dues', value: count, icon: Users, gradient: 'from-orange-400 to-amber-500' },
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

        <DataTable
          columns={columns}
          data={students}
          loading={isLoading}
          searchKeys={['name', 'roll_no', 'class_name']}
          pageSize={15}
          actions={
            <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="h-9 text-sm">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
            </Select>
          }
          emptyState={
            <EmptyState
              icon={CheckCircle2}
              title="All clear!"
              description="No outstanding dues found."
            />
          }
        />
      </div>
    </DashboardLayout>
  )
}