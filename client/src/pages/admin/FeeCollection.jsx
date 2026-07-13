import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStudentFeeStatus, recordPayment, downloadReceipt, downloadInvoice } from '../../api/fees.api'
import api from '../../api/axios'
import { triggerPDFDownload } from '../../utils/downloadPDF'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import Card, { CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card'
import { DollarSign, Search, Download, CheckCircle2, AlertCircle, Receipt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const METHODS = ['cash', 'cheque', 'bank_transfer']

function PaymentModal({ student, due, onClose }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    fee_type: due?.fee_type || '',
    amount: due?.balance || '',
    payment_date: today,
    method: 'cash',
    notes: '',
  })
  const [success, setSuccess] = useState(null)
  const [error, setError]     = useState('')

  const mutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: (data) => {
      setSuccess(data.receipt_no)
      qc.invalidateQueries({ queryKey: ['student-fee-status', String(student.id)] })
    },
    onError: (err) => setError(err.response?.data?.error || 'Payment failed.'),
  })

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <Modal open onClose={onClose} title="Record Payment" subtitle={`Collecting fee for ${student.name}`} size="sm"
      footer={!success && <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate({ ...form, student_id: student.id }) }}>
          Record Payment
        </Button>
      </>}
    >
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Payment Recorded!</h3>
            <p className="text-sm text-slate-500 mt-1">Receipt Number:</p>
            <p className="text-base font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl mt-2">
              {success}
            </p>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0" />{error}
            </div>
          )}
          <div className="space-y-3">
            <Input label="Fee Type" {...f('fee_type')} readOnly />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount (₹)" type="number" {...f('amount')} placeholder="0.00" />
              <Input label="Payment Date" type="date" {...f('payment_date')} />
            </div>
            <Select label="Payment Method" {...f('method')}>
              {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </Select>
            <Input label="Notes (Optional)" placeholder="Cheque no., reference, etc." {...f('notes')} />
          </div>
        </>
      )}
    </Modal>
  )
}

export default function FeeCollection() {
  const [searchText, setSearchText] = useState('')
  const [studentId,  setStudentId]  = useState(null)
  const [payModal,   setPayModal]   = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students-list'],
    queryFn: () => api.get('/students').then(r => r.data),
  })

  const filteredStudents = searchText.length >= 2
    ? allStudents.filter(s =>
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 8)
    : []

  const { data: feeStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['student-fee-status', String(studentId)],
    queryFn: () => fetchStudentFeeStatus(studentId),
    enabled: !!studentId,
  })

  const handleDownloadReceipt = async (receiptNo) => {
    try {
      const res = await downloadReceipt(receiptNo)
      triggerPDFDownload(res, `receipt-${receiptNo}.pdf`)
    } catch { alert('Failed to download receipt.') }
  }

  const handleDownloadInvoice = async (sId, studentName) => {
    try {
      const res = await downloadInvoice(sId)
      triggerPDFDownload(res, `invoice-${studentName.replace(/\s+/g, '_')}.pdf`)
    } catch { alert('Failed to download invoice.') }
  }

  const summary = feeStatus?.summary || {}
  const dues    = feeStatus?.dues    || []
  const payments= feeStatus?.payments|| []

  return (
    <DashboardLayout title="Fee Collection">
      <div className="p-6 space-y-6 max-w-5xl">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Fee Collection</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Search a student to view dues and record payments</p>
        </div>

        {/* ── Student search ── */}
        <Card>
          <div className="relative max-w-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Search Student</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setShowDropdown(true) }}
                placeholder="Type name or email..."
                className="
                  w-full h-10 pl-9 pr-3 rounded-xl text-sm border
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                  transition-all duration-200
                "
              />
              <AnimatePresence>
                {filteredStudents.length > 0 && showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 mt-1 overflow-hidden"
                  >
                    {filteredStudents.map(s => (
                      <button key={s.id}
                        onClick={() => { setStudentId(s.id); setSearchText(s.name); setShowDropdown(false) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border-b border-slate-50 dark:border-slate-800/60 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {s.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.class_name} {s.section}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* ── Fee Status ── */}
        {studentId && (statusLoading ? (
          <Card>
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-slate-400">Loading fee status…</p>
            </div>
          </Card>
        ) : feeStatus && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Student banner */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-700 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base shrink-0">
                {feeStatus.student?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-base">{feeStatus.student?.name}</p>
                <p className="text-purple-200 text-sm">{feeStatus.student?.class_name} {feeStatus.student?.section}</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Due',  value: `₹${(summary.total_due    || 0).toLocaleString('en-IN')}`, color: 'text-slate-800 dark:text-slate-100',  gradient: 'from-slate-400 to-slate-600'   },
                { label: 'Total Paid', value: `₹${(summary.total_paid   || 0).toLocaleString('en-IN')}`, color: 'text-emerald-600 dark:text-emerald-400',gradient: 'from-emerald-500 to-teal-600'  },
                { label: 'Balance',    value: `₹${(summary.total_balance|| 0).toLocaleString('en-IN')}`, color: summary.total_balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600', gradient: summary.total_balance > 0 ? 'from-red-400 to-rose-600' : 'from-emerald-500 to-teal-600' },
                { label: 'Status',     value: null, status: summary.status },
              ].map((s, i) => (
                <Card key={i}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
                  {s.status ? (
                    <StatusBadge status={s.status} />
                  ) : (
                    <p className={`text-xl font-bold font-display ${s.color}`}>{s.value}</p>
                  )}
                </Card>
              ))}
            </div>

            {/* Dues table */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fee-wise Dues</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Fee Type</th>
                      <th className="text-left px-5 py-3">Frequency</th>
                      <th className="text-right px-5 py-3">Due</th>
                      <th className="text-right px-5 py-3">Paid</th>
                      <th className="text-right px-5 py-3">Balance</th>
                      <th className="text-center px-5 py-3">Status</th>
                      <th className="text-center px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {dues.map((due, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{due.fee_type}</td>
                        <td className="px-5 py-3 text-slate-500 capitalize text-xs">{due.frequency}</td>
                        <td className="px-5 py-3 text-right text-slate-700 dark:text-slate-300">₹{due.total_due.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">₹{due.paid.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right font-semibold">
                          <span className={due.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            ₹{due.balance.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center"><StatusBadge status={due.status} /></td>
                        <td className="px-5 py-3 text-center">
                          {due.balance > 0 && (
                            <Button size="sm" onClick={() => setPayModal({ student: feeStatus.student, due })}>
                              Collect
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payment History */}
            {payments.length > 0 && (
              <Card padding="none">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Payment History</h3>
                  <Button size="sm" variant="outline" leftIcon={<Download size={13} />}
                    onClick={() => handleDownloadInvoice(studentId, feeStatus.student.name)}>
                    Full Invoice
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Receipt No</th>
                        <th className="text-left px-5 py-3">Fee Type</th>
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3">Method</th>
                        <th className="text-right px-5 py-3">Amount</th>
                        <th className="text-center px-5 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-primary-600 dark:text-primary-400">{p.receipt_no}</td>
                          <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.fee_type}</td>
                          <td className="px-5 py-3 text-slate-500">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={p.method?.replace('_', ' ')} />
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Button size="sm" variant="outline" leftIcon={<Receipt size={12} />}
                              onClick={() => handleDownloadReceipt(p.receipt_no)}>
                              Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        ))}

        {payModal && (
          <PaymentModal
            student={payModal.student}
            due={payModal.due}
            onClose={() => setPayModal(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}