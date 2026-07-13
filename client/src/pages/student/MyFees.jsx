import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentFeeStatus, downloadReceipt, downloadInvoice } from '../../api/fees.api'
import api from '../../api/axios'
import { triggerPDFDownload } from '../../utils/downloadPDF'
import DashboardLayout from '../../components/DashboardLayout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Download, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_VARIANT = { paid: 'success', partial: 'warning', pending: 'danger', cleared: 'success' }

export default function MyFees() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled: !!user,
  })

  const { data: feeStatus, isLoading } = useQuery({
    queryKey: ['my-fee-status', studentRecord?.id],
    queryFn: () => fetchStudentFeeStatus(studentRecord.id),
    enabled: !!studentRecord?.id,
  })

  const handleDownloadReceipt = async (receiptNo) => {
    try { const res = await downloadReceipt(receiptNo); triggerPDFDownload(res, `receipt-${receiptNo}.pdf`) }
    catch { alert('Failed to download receipt.') }
  }

  const handleDownloadInvoice = async () => {
    try { const res = await downloadInvoice(studentRecord.id); triggerPDFDownload(res, `invoice.pdf`) }
    catch { alert('Failed to download invoice.') }
  }

  return (
    <DashboardLayout title="My Fees">
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">My Fees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your fee dues and payment history</p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading fee details…</p></Card>
        ) : feeStatus && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Due', value: `₹${feeStatus.summary.total_due.toLocaleString('en-IN')}`, icon: DollarSign, gradient: 'from-slate-500 to-slate-700' },
                { label: 'Total Paid', value: `₹${feeStatus.summary.total_paid.toLocaleString('en-IN')}`, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
                { label: 'Balance', value: `₹${feeStatus.summary.total_balance.toLocaleString('en-IN')}`, icon: AlertTriangle, gradient: feeStatus.summary.total_balance > 0 ? 'from-red-400 to-rose-600' : 'from-emerald-500 to-teal-600' },
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

            {/* Dues table */}
            <Card padding="none">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Fee Breakdown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Fee Type</th>
                      <th className="text-right px-5 py-3">Due</th>
                      <th className="text-right px-5 py-3">Paid</th>
                      <th className="text-right px-5 py-3">Balance</th>
                      <th className="text-center px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {feeStatus.dues.map((due, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{due.fee_type}</td>
                        <td className="px-5 py-3 text-right text-slate-700 dark:text-slate-300">₹{due.total_due.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400">₹{due.paid.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-right font-semibold">
                          <span className={due.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            ₹{due.balance.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={STATUS_VARIANT[due.status] || 'default'}>{due.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payment history */}
            {feeStatus.payments.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment History</h2>
                  <Button size="sm" leftIcon={<Download size={13} />} onClick={handleDownloadInvoice}>
                    Download Invoice
                  </Button>
                </div>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-5 py-3">Receipt No</th>
                          <th className="text-left px-5 py-3">Fee Type</th>
                          <th className="text-left px-5 py-3">Date</th>
                          <th className="text-right px-5 py-3">Amount</th>
                          <th className="text-center px-5 py-3">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {feeStatus.payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-primary-600 dark:text-primary-400">{p.receipt_no}</td>
                            <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.fee_type}</td>
                            <td className="px-5 py-3 text-slate-500">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3 text-center">
                              <Button size="sm" variant="outline" leftIcon={<Download size={11} />} onClick={() => handleDownloadReceipt(p.receipt_no)}>
                                PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}