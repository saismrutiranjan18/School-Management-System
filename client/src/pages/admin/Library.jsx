import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchBooks, addBook, updateBook,
  deleteBook, issueBook, returnBook,
  fetchIssuedBooks, fetchOverdueBooks,
} from '../../api/library.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import {
  BookOpen, Plus, Search, Edit3, Trash2, ArrowRightLeft,
  RotateCcw, AlertTriangle, CheckCircle2, DollarSign, Library as LibIcon,
} from 'lucide-react'

const CATEGORIES = [
  'Textbook','Reference','Fiction','Non-Fiction',
  'Biography','Science','Technology','History',
  'Geography','Language','Sports','General',
]

/* ── Book Modal ── */
function BookModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    title: existing?.title || '', author: existing?.author || '', isbn: existing?.isbn || '',
    publisher: existing?.publisher || '', category: existing?.category || 'General',
    total_copies: existing?.total_copies || 1, rack_no: existing?.rack_no || '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateBook(existing.id, data) : addBook(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Book' : 'Add Book'}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
          {isEdit ? 'Update' : 'Add Book'}
        </Button>
      </>}>
      {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-2 rounded-xl">{error}</p>}
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
        <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Book title" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
          <Input label="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Publisher" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher" />
          <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Total Copies" type="number" min="1" value={form.total_copies} onChange={e => setForm({ ...form, total_copies: e.target.value })} />
          <Input label="Rack No." value={form.rack_no} onChange={e => setForm({ ...form, rack_no: e.target.value })} placeholder="e.g. A-12" />
        </div>
      </form>
    </Modal>
  )
}

/* ── Issue Modal ── */
function IssueModal({ book, onClose }) {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const due = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [dueDate, setDueDate] = useState(due)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students-list'], queryFn: () => api.get('/students').then(r => r.data),
  })

  const filteredStudents = studentSearch.length >= 2
    ? allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 6)
    : []

  const mutation = useMutation({
    mutationFn: issueBook,
    onSuccess: (data) => { setSuccess(data); qc.invalidateQueries({ queryKey: ['books'] }); qc.invalidateQueries({ queryKey: ['issued-books'] }) },
    onError: (err) => setError(err.response?.data?.error || 'Failed to issue book.'),
  })

  const handleIssue = () => {
    if (!selectedStudent) return setError('Please select a student.')
    setError('')
    mutation.mutate({ book_id: book.id, student_id: selectedStudent.id, due_date: dueDate })
  }

  return (
    <Modal open onClose={onClose} title="Issue Book"
      footer={!success && <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={handleIssue}>Issue Book</Button>
      </>}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Book Issued!</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400"><strong>{book.title}</strong> issued to <strong>{selectedStudent?.name}</strong></p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Due date: {dueDate}</p>
          <Button className="mt-4" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{book.title}</span>
            <Badge variant="success">{book.available_copies} available</Badge>
          </div>
          {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-2 rounded-xl">{error}</p>}
          <div className="relative mb-3">
            <Input label="Search Student" value={studentSearch}
              onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null) }}
              placeholder="Type student name…" leftIcon={<Search size={14} />} />
            {filteredStudents.length > 0 && !selectedStudent && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 mt-1 overflow-hidden">
                {filteredStudents.map(s => (
                  <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(s.name) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{s.name}</span>
                    <span className="text-slate-400 ml-2 text-xs">{s.class_name} {s.section}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedStudent && (
            <div className="mb-3 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 rounded-xl text-sm text-primary-700 dark:text-primary-300">
              ✓ {selectedStudent.name} — {selectedStudent.class_name} {selectedStudent.section}
            </div>
          )}
          <Input label="Due Date" type="date" value={dueDate} min={today} onChange={e => setDueDate(e.target.value)} />
        </>
      )}
    </Modal>
  )
}

/* ── Return Modal ── */
function ReturnModal({ issue, onClose }) {
  const qc = useQueryClient()
  const [finePaid, setFinePaid] = useState(false)
  const [result, setResult] = useState(null)

  const today = new Date()
  const dueDate = new Date(issue.due_date)
  const overdue = Math.max(0, Math.ceil((today - dueDate) / 86400000))
  const fine = parseFloat((overdue * issue.fine_per_day || 2).toFixed(2))

  const mutation = useMutation({
    mutationFn: () => returnBook(issue.id, { fine_paid: finePaid || fine === 0 }),
    onSuccess: (data) => { setResult(data); qc.invalidateQueries({ queryKey: ['issued-books'] }); qc.invalidateQueries({ queryKey: ['overdue-books'] }); qc.invalidateQueries({ queryKey: ['books'] }) },
  })

  return (
    <Modal open onClose={onClose} title="Return Book"
      footer={!result && <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Confirm Return</Button>
      </>}>
      {result ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Book Returned!</h3>
          {result.fine_amount > 0 && (
            <div className={`p-3 rounded-xl mb-3 text-sm ${result.fine_paid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
              Fine: ₹{result.fine_amount} — {result.fine_paid ? '✓ Collected' : '⚠ Pending'}
            </div>
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {[
            { label: 'Book', value: issue.book_title },
            { label: 'Student', value: issue.student_name },
          ].map(item => (
            <div key={item.label} className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">{item.label}</span><span className="font-medium text-slate-800 dark:text-slate-100">{item.value}</span></div>
          ))}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Due Date</span>
            <span className={overdue > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-800 dark:text-slate-100'}>{dueDate.toLocaleDateString('en-IN')}</span>
          </div>
          {overdue > 0 && (
            <>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Overdue Days</span><span className="text-red-600 dark:text-red-400 font-semibold">{overdue} days</span></div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3"><span className="text-slate-500 dark:text-slate-400">Fine Amount</span><span className="text-red-600 dark:text-red-400 font-bold text-base">₹{fine.toFixed(2)}</span></div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input type="checkbox" checked={finePaid} onChange={e => setFinePaid(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Fine collected from student</span>
              </label>
            </>
          )}
          {overdue === 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs">
              <CheckCircle2 size={14} /> No fine — returned on time
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ── Main Library Page ── */
export default function Library() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('catalog')
  const [modal, setModal] = useState(null)
  const [issueModal, setIssueModal] = useState(null)
  const [returnModal, setReturnModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterAvail, setFilterAvail] = useState(false)

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books', search, filterCat, filterAvail],
    queryFn: () => fetchBooks({ search: search || undefined, category: filterCat || undefined, available: filterAvail ? 'true' : undefined }),
  })

  const { data: issuedBooks = [], isLoading: issuedLoading } = useQuery({
    queryKey: ['issued-books'], queryFn: fetchIssuedBooks, enabled: tab === 'issued',
  })

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-books'], queryFn: fetchOverdueBooks, enabled: tab === 'overdue',
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
    onError: (err) => alert(err.response?.data?.error || 'Delete failed.'),
  })

  const overdueCount = overdueData?.count || 0

  const summaryStats = [
    { label: 'Total Books', value: books.reduce((s, b) => s + parseInt(b.total_copies), 0), icon: BookOpen, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Available', value: books.reduce((s, b) => s + parseInt(b.available_copies), 0), icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Issued', value: issuedBooks.length, icon: ArrowRightLeft, gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Overdue', value: overdueCount, icon: AlertTriangle, gradient: 'from-red-400 to-rose-600' },
  ]

  return (
    <DashboardLayout title="Library">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Library</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage books, issue and return tracking</p>
          </div>
          {tab === 'catalog' && <Button leftIcon={<Plus size={14} />} onClick={() => setModal('add')}>Add Book</Button>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {summaryStats.map((s, i) => (
            <Card key={i} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}>
                <s.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {[
            { key: 'catalog', label: 'Catalog' },
            { key: 'issued', label: 'Issued' },
            { key: 'overdue', label: `Overdue${overdueCount > 0 ? ` (${overdueCount})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${tab === t.key ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CATALOG TAB ── */}
        {tab === 'catalog' && (
          <>
            <div className="flex gap-3 flex-wrap items-end">
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, author, ISBN…" leftIcon={<Search size={14} />}
                containerClass="w-64" />
              <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} containerClass="w-44">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <input type="checkbox" checked={filterAvail} onChange={e => setFilterAvail(e.target.checked)} className="w-4 h-4 accent-primary-600 rounded" />
                Available only
              </label>
            </div>

            {booksLoading ? (
              <Card><p className="text-sm text-slate-400 text-center py-12">Loading books…</p></Card>
            ) : (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Title / Author</th>
                        <th className="text-left px-5 py-3">Category</th>
                        <th className="text-left px-5 py-3">ISBN</th>
                        <th className="text-center px-4 py-3">Total</th>
                        <th className="text-center px-4 py-3">Available</th>
                        <th className="text-left px-5 py-3">Rack</th>
                        <th className="text-left px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {books.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <BookOpen size={40} className="opacity-30" />
                            <span className="text-sm">No books found.</span>
                          </div>
                        </td></tr>
                      )}
                      {books.map(book => (
                        <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                                <BookOpen size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{book.title}</p>
                                <p className="text-xs text-slate-400">{book.author || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3"><Badge variant="purple">{book.category}</Badge></td>
                          <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">{book.isbn || '—'}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{book.total_copies}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${parseInt(book.available_copies) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                              {book.available_copies}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{book.rack_no || '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              {parseInt(book.available_copies) > 0 && (
                                <Button size="sm" variant="success" onClick={() => setIssueModal(book)}>Issue</Button>
                              )}
                              <Button size="sm" variant="outline" leftIcon={<Edit3 size={11} />} onClick={() => setModal(book)}>Edit</Button>
                              <Button size="sm" variant="danger" leftIcon={<Trash2 size={11} />}
                                onClick={() => { if (confirm('Delete this book?')) deleteMutation.mutate(book.id) }}>Del</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── ISSUED TAB ── */}
        {tab === 'issued' && (
          issuedLoading ? <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card> : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">Book</th>
                      <th className="text-left px-5 py-3">Student</th>
                      <th className="text-left px-5 py-3">Issue Date</th>
                      <th className="text-left px-5 py-3">Due Date</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {issuedBooks.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <CheckCircle2 size={40} className="text-emerald-400 opacity-50" />
                          <span className="text-sm">No books currently issued.</span>
                        </div>
                      </td></tr>
                    )}
                    {issuedBooks.map(issue => (
                      <tr key={issue.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${issue.is_overdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{issue.book_title}</p>
                          <p className="text-xs text-slate-400">{issue.book_author}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-slate-800 dark:text-slate-100">{issue.student_name}</p>
                          <p className="text-xs text-slate-400">{issue.class_name} {issue.section}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{new Date(issue.issue_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-3">
                          <span className={issue.is_overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                            {new Date(issue.due_date).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {issue.is_overdue ? (
                            <Badge variant="danger">Overdue — ₹{parseFloat(issue.current_fine).toFixed(2)}</Badge>
                          ) : (
                            <Badge variant="success">{issue.days_remaining >= 0 ? `${issue.days_remaining}d left` : 'Due today'}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" leftIcon={<RotateCcw size={11} />} onClick={() => setReturnModal(issue)}>Return</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        )}

        {/* ── OVERDUE TAB ── */}
        {tab === 'overdue' && (
          overdueLoading ? <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card> : (
            <>
              {overdueData?.count > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-display">{overdueData.count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Overdue Books</p>
                    </div>
                  </Card>
                  <Card className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <DollarSign size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-display">₹{parseFloat(overdueData.total_fine).toFixed(2)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Accrued Fine</p>
                    </div>
                  </Card>
                </div>
              )}
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-5 py-3">Book</th>
                        <th className="text-left px-5 py-3">Student</th>
                        <th className="text-left px-5 py-3">Due Date</th>
                        <th className="text-center px-4 py-3">Overdue</th>
                        <th className="text-right px-5 py-3">Fine</th>
                        <th className="text-left px-5 py-3">Contact</th>
                        <th className="text-center px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {(!overdueData?.records || overdueData.records.length === 0) && (
                        <tr><td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <CheckCircle2 size={40} className="text-emerald-400 opacity-50" />
                            <span className="text-sm">No overdue books!</span>
                          </div>
                        </td></tr>
                      )}
                      {overdueData?.records?.map(issue => (
                        <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{issue.book_title}</td>
                          <td className="px-5 py-3">
                            <p className="text-slate-800 dark:text-slate-100">{issue.student_name}</p>
                            <p className="text-xs text-slate-400">{issue.class_name} {issue.section}</p>
                          </td>
                          <td className="px-5 py-3 text-red-600 dark:text-red-400 font-medium">{new Date(issue.due_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 text-center"><Badge variant="danger">{issue.overdue_days}d</Badge></td>
                          <td className="px-5 py-3 text-right text-red-600 dark:text-red-400 font-bold">₹{parseFloat(issue.accrued_fine).toFixed(2)}</td>
                          <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{issue.guardian_phone || issue.guardian_email || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" leftIcon={<RotateCcw size={11} />} onClick={() => setReturnModal(issue)}>Return</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )
        )}

        {modal && <BookModal onClose={() => setModal(null)} existing={modal === 'add' ? null : modal} />}
        {issueModal && <IssueModal onClose={() => setIssueModal(null)} book={issueModal} />}
        {returnModal && <ReturnModal onClose={() => setReturnModal(null)} issue={returnModal} />}
      </div>
    </DashboardLayout>
  )
}