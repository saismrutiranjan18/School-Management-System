import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStudentFeeStatus, recordPayment, downloadReceipt, downloadInvoice } from '../../api/fees.api'
import api from '../../api/axios'
import { triggerPDFDownload } from '../../utils/downloadPDF'
import DashboardLayout from '../../components/DashboardLayout'

const METHODS        = ['cash','cheque','bank_transfer']
const METHOD_BADGE   = {
  cash:          'bg-green-50 text-green-700',
  cheque:        'bg-blue-50 text-blue-700',
  bank_transfer: 'bg-purple-50 text-purple-700',
}
const STATUS_BADGE   = {
  paid:    'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
  cleared: 'bg-green-100 text-green-700',
}

function PaymentModal({ student, due, onClose }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    fee_type:     due?.fee_type || '',
    amount:       due?.balance  || '',
    payment_date: today,
    method:       'cash',
    notes:        '',
  })
  const [success, setSuccess] = useState(null)
  const [error,   setError]   = useState('')

  const mutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: (data) => {
      setSuccess(data.receipt_no)
      qc.invalidateQueries({ queryKey: ['student-fee-status', String(student.id)] })
    },
    onError: (err) => setError(err.response?.data?.error || 'Payment failed.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({ ...form, student_id: student.id })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Payment Recorded!</h2>
            <p className="text-sm text-gray-500 mb-2">Receipt Number:</p>
            <p className="text-base font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
              {success}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Go to "Invoice & Receipt" to download the PDF receipt.
            </p>
            <button onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-1">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              {student.name} — {student.class_name} {student.section}
            </p>

            {error && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Fee Type</label>
                <input value={form.fee_type}
                  onChange={e => setForm({ ...form, fee_type: e.target.value })}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                  <input type="number" min="1" step="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Date</label>
                  <input type="date" value={form.payment_date}
                    max={today}
                    onChange={e => setForm({ ...form, payment_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <div className="flex gap-2 mt-1">
                  {METHODS.map(m => (
                    <button key={m} type="button"
                      onClick={() => setForm({ ...form, method: m })}
                      className={`flex-1 py-2 text-xs rounded-lg border font-medium capitalize transition
                        ${form.method === m
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}>
                      {m.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Cheque no, reference, etc."
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={mutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {mutation.isPending ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function FeeCollection() {
  const [searchEmail, setSearchEmail] = useState('')
  const [studentId,   setStudentId]   = useState(null)
  const [payModal,    setPayModal]     = useState(null)

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students-list'],
    queryFn:  () => api.get('/students').then(r => r.data),
  })

  const filteredStudents = searchEmail.length >= 2
    ? allStudents.filter(s =>
        s.name.toLowerCase().includes(searchEmail.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchEmail.toLowerCase())
      ).slice(0, 8)
    : []

  const { data: feeStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['student-fee-status', String(studentId)],
    queryFn:  () => fetchStudentFeeStatus(studentId),
    enabled:  !!studentId,
  })

  const handleDownloadReceipt = async (receiptNo) => {
    try {
      const res = await downloadReceipt(receiptNo)
      triggerPDFDownload(res, `receipt-${receiptNo}.pdf`)
    } catch {
      alert('Failed to download receipt.')
    }
  }

  const handleDownloadInvoice = async (sId, studentName) => {
    try {
      const res = await downloadInvoice(sId)
      triggerPDFDownload(res, `invoice-${studentName.replace(/\s+/g,'_')}.pdf`)
    } catch {
      alert('Failed to download invoice.')
    }
  }

  return (
    <DashboardLayout title="Fee Collection">
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Fee Collection</h1>
          <p className="text-sm text-gray-500 mt-0.5">Search a student to view dues and record payments</p>
        </div>

      {/* Student Search */}
      <div className="relative mb-6 max-w-sm">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Search Student</label>
        <input
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          placeholder="Type student name..."
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filteredStudents.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
            {filteredStudents.map(s => (
              <button key={s.id}
                onClick={() => { setStudentId(s.id); setSearchEmail(s.name) }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{s.class_name} {s.section}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fee Status */}
      {studentId && (
        statusLoading ? (
          <p className="text-gray-400 text-sm">Loading fee status...</p>
        ) : feeStatus && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Due',  value: `₹${feeStatus.summary.total_due.toLocaleString('en-IN')}`,     color: 'text-gray-800' },
                { label: 'Total Paid', value: `₹${feeStatus.summary.total_paid.toLocaleString('en-IN')}`,    color: 'text-green-600' },
                { label: 'Balance',    value: `₹${feeStatus.summary.total_balance.toLocaleString('en-IN')}`, color: feeStatus.summary.total_balance > 0 ? 'text-red-500' : 'text-green-600' },
                { label: 'Status',     value: feeStatus.summary.status,                                       color: '' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  {s.label === 'Status' ? (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[feeStatus.summary.status]}`}>
                      {feeStatus.summary.status}
                    </span>
                  ) : (
                    <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Dues per fee type */}
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fee-wise Dues</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
                <tbody className="divide-y divide-gray-100">
                  {feeStatus.dues.map((due, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{due.fee_type}</td>
                      <td className="px-5 py-3 text-gray-500 capitalize text-xs">{due.frequency}</td>
                      <td className="px-5 py-3 text-right text-gray-700">₹{due.total_due.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-right text-green-600">₹{due.paid.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-right font-semibold">
                        <span className={due.balance > 0 ? 'text-red-500' : 'text-green-600'}>
                          ₹{due.balance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[due.status]}`}>
                          {due.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {due.balance > 0 && (
                          <button
                            onClick={() => setPayModal({ student: feeStatus.student, due })}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment History */}
            {feeStatus.payments.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Payment History</h2>
                  <button
                    onClick={() => handleDownloadInvoice(studentId, feeStatus.student.name)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    ⬇ Download Full Invoice
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Receipt No</th>
                        <th className="text-left px-5 py-3">Fee Type</th>
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3">Method</th>
                        <th className="text-right px-5 py-3">Amount</th>
                        <th className="text-center px-5 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {feeStatus.payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-blue-600">{p.receipt_no}</td>
                          <td className="px-5 py-3 text-gray-700">{p.fee_type}</td>
                          <td className="px-5 py-3 text-gray-500">
                            {new Date(p.payment_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${METHOD_BADGE[p.method]}`}>
                              {p.method.replace('_',' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-green-600">
                            ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => handleDownloadReceipt(p.receipt_no)}
                              className="text-xs px-3 py-1 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                            >
                              ⬇ Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )
      )}

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