import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentFeeStatus, downloadReceipt, downloadInvoice } from '../../api/fees.api'
import api from '../../api/axios'
import { triggerPDFDownload } from '../../utils/downloadPDF'

const STATUS_BADGE = {
  paid:    'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
  cleared: 'bg-green-100 text-green-700',
}

export default function MyFees() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn:  () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled:  !!user,
  })

  const { data: feeStatus, isLoading } = useQuery({
    queryKey: ['my-fee-status', studentRecord?.id],
    queryFn:  () => fetchStudentFeeStatus(studentRecord.id),
    enabled:  !!studentRecord?.id,
  })

  const handleDownloadReceipt = async (receiptNo) => {
    try {
      const res = await downloadReceipt(receiptNo)
      triggerPDFDownload(res, `receipt-${receiptNo}.pdf`)
    } catch {
      alert('Failed to download receipt.')
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const res = await downloadInvoice(studentRecord.id)
      triggerPDFDownload(res, `invoice.pdf`)
    } catch {
      alert('Failed to download invoice.')
    }
  }

  if (isLoading) return <p className="p-8 text-gray-400 text-sm">Loading fee details...</p>

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Fees</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your fee dues and payment history</p>
      </div>

      {feeStatus && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Due', value: `₹${feeStatus.summary.total_due.toLocaleString('en-IN')}`,     color: 'text-gray-800' },
              { label: 'Paid',      value: `₹${feeStatus.summary.total_paid.toLocaleString('en-IN')}`,    color: 'text-green-600' },
              { label: 'Balance',   value: `₹${feeStatus.summary.total_balance.toLocaleString('en-IN')}`, color: feeStatus.summary.total_balance > 0 ? 'text-red-500' : 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Dues table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Fee Type</th>
                  <th className="text-right px-5 py-3">Due</th>
                  <th className="text-right px-5 py-3">Paid</th>
                  <th className="text-right px-5 py-3">Balance</th>
                  <th className="text-center px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeStatus.dues.map((due, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{due.fee_type}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment history */}
          {feeStatus.payments.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Payment History</h2>
                <button
                  onClick={handleDownloadInvoice}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                      <th className="text-right px-5 py-3">Amount</th>
                      <th className="text-center px-5 py-3">PDF</th>
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
                        <td className="px-5 py-3 text-right font-semibold text-green-600">
                          ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleDownloadReceipt(p.receipt_no)}
                            className="text-xs px-3 py-1 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            ⬇ PDF
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
      )}
    </div>
  )
}