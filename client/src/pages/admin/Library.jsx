import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  fetchIssuedBooks,
  fetchOverdueBooks,
} from "../../api/library.api";
import api from "../../api/axios";

const CATEGORIES = [
  "Textbook",
  "Reference",
  "Fiction",
  "Non-Fiction",
  "Biography",
  "Science",
  "Technology",
  "History",
  "Geography",
  "Language",
  "Sports",
  "General",
];

// ── Book Modal ─────────────────────────────────────────────────────────
function BookModal({ onClose, existing }) {
  const qc = useQueryClient();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title || "",
    author: existing?.author || "",
    isbn: existing?.isbn || "",
    publisher: existing?.publisher || "",
    category: existing?.category || "General",
    total_copies: existing?.total_copies || 1,
    rack_no: existing?.rack_no || "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateBook(existing.id, data) : addBook(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Book" : "Add Book"}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Book title"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Author
              </label>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Author name"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ISBN</label>
              <input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                placeholder="ISBN number"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Publisher
              </label>
              <input
                value={form.publisher}
                onChange={(e) =>
                  setForm({ ...form, publisher: e.target.value })
                }
                placeholder="Publisher name"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Total Copies
              </label>
              <input
                type="number"
                min="1"
                value={form.total_copies}
                onChange={(e) =>
                  setForm({ ...form, total_copies: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Rack No.
              </label>
              <input
                value={form.rack_no}
                onChange={(e) => setForm({ ...form, rack_no: e.target.value })}
                placeholder="e.g. A-12"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Issue Book Modal ───────────────────────────────────────────────────
function IssueModal({ book, onClose }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const due = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dueDate, setDueDate] = useState(due);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students-list"],
    queryFn: () => api.get("/students").then((r) => r.data),
  });

  const filteredStudents =
    studentSearch.length >= 2
      ? allStudents
          .filter((s) =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const mutation = useMutation({
    mutationFn: issueBook,
    onSuccess: (data) => {
      setSuccess(data);
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["issued-books"] });
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Failed to issue book."),
  });

  const handleIssue = () => {
    if (!selectedStudent) return setError("Please select a student.");
    setError("");
    mutation.mutate({
      book_id: book.id,
      student_id: selectedStudent.id,
      due_date: dueDate,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        {success ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3 text-blue-600">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Book Issued!
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{book.title}</strong> issued to{" "}
              <strong>{selectedStudent?.name}</strong>
            </p>
            <p className="text-sm text-gray-500">Due date: {dueDate}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-1">Issue Book</h2>
            <p className="text-sm text-gray-500 mb-4">
              📖 <strong>{book.title}</strong>
              <span className="ml-2 text-xs text-green-600">
                {book.available_copies} copies available
              </span>
            </p>

            {error && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Student search */}
            <div className="relative mb-3">
              <label className="text-sm font-medium text-gray-700">
                Search Student
              </label>
              <input
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setSelectedStudent(null);
                }}
                placeholder="Type student name..."
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filteredStudents.length > 0 && !selectedStudent && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-0.5">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentSearch(s.name);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {s.class_name} {s.section}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                ✓ {selectedStudent.name} — {selectedStudent.class_name}{" "}
                {selectedStudent.section}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleIssue}
                disabled={mutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending ? "Issuing..." : "Issue Book"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Return Book Modal ──────────────────────────────────────────────────
function ReturnModal({ issue, onClose }) {
  const qc = useQueryClient();
  const [finePaid, setFinePaid] = useState(false);
  const [result, setResult] = useState(null);

  const today = new Date();
  const dueDate = new Date(issue.due_date);
  const overdue = Math.max(0, Math.ceil((today - dueDate) / 86400000));
  const fine = overdue * parseFloat(issue.fine_per_day || 2);

  const mutation = useMutation({
    mutationFn: () =>
      returnBook(issue.id, { fine_paid: finePaid || fine === 0 }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["issued-books"] });
      qc.invalidateQueries({ queryKey: ["overdue-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        {result ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-3 text-green-600">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Book Returned!
            </h2>
            {result.fine_amount > 0 && (
              <div
                className={`p-3 rounded-lg mb-3 text-sm ${result.fine_paid ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
              >
                Fine: ₹{result.fine_amount} —{" "}
                {result.fine_paid ? "✓ Collected" : "⚠ Pending"}
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">Return Book</h2>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Book</span>
                <span className="font-medium text-gray-800">
                  {issue.book_title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-medium text-gray-800">
                  {issue.student_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span
                  className={
                    overdue > 0 ? "text-red-600 font-medium" : "text-gray-800"
                  }
                >
                  {new Date(issue.due_date).toLocaleDateString("en-IN")}
                </span>
              </div>
              {overdue > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Overdue Days</span>
                    <span className="text-red-600 font-semibold">
                      {overdue} days
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="text-gray-500">Fine Amount</span>
                    <span className="text-red-600 font-bold text-base">
                      ₹{fine.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="fine_paid"
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <label
                      htmlFor="fine_paid"
                      className="text-sm text-gray-700"
                    >
                      Fine collected from student
                    </label>
                  </div>
                </>
              )}

              {overdue === 0 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs text-center">
                  ✅ No fine — returned on time
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Library Page ──────────────────────────────────────────────────
export default function Library() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("catalog");
  const [modal, setModal] = useState(null);
  const [issueModal, setIssueModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAvail, setFilterAvail] = useState(false);

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["books", search, filterCat, filterAvail],
    queryFn: () =>
      fetchBooks({
        search: search || undefined,
        category: filterCat || undefined,
        available: filterAvail ? "true" : undefined,
      }),
  });

  const { data: issuedBooks = [], isLoading: issuedLoading } = useQuery({
    queryKey: ["issued-books"],
    queryFn: fetchIssuedBooks,
    enabled: tab === "issued",
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ["overdue-books"],
    queryFn: fetchOverdueBooks,
    enabled: tab === "overdue",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
    onError: (err) => alert(err.response?.data?.error || "Delete failed."),
  });

  const overdueCount = overdueData?.count || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage books, issue and return tracking
          </p>
        </div>
        {tab === "catalog" && (
          <button
            onClick={() => setModal("add")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Book
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Books",
            value: books.reduce((s, b) => s + parseInt(b.total_copies), 0),
            color: "text-gray-800",
          },
          {
            label: "Available",
            value: books.reduce((s, b) => s + parseInt(b.available_copies), 0),
            color: "text-green-600",
          },
          {
            label: "Issued",
            value: issuedBooks.length,
            color: "text-blue-600",
          },
          { label: "Overdue", value: overdueCount, color: "text-red-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "catalog", label: "📚 Catalog" },
          { key: "issued", label: "📋 Issued" },
          {
            key: "overdue",
            label: `⚠️ Overdue${overdueCount > 0 ? ` (${overdueCount})` : ""}`,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition
              ${tab === t.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CATALOG TAB ── */}
      {tab === "catalog" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filterAvail}
                onChange={(e) => setFilterAvail(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Available only
            </label>
          </div>

          {booksLoading ? (
            <p className="text-gray-400 text-sm">Loading books...</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
                <tbody className="divide-y divide-gray-100">
                  {books.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-gray-400"
                      >
                        No books found.
                      </td>
                    </tr>
                  )}
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">
                          {book.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {book.author || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                        {book.isbn || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {book.total_copies}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold ${parseInt(book.available_copies) > 0 ? "text-green-600" : "text-red-500"}`}
                        >
                          {book.available_copies}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {book.rack_no || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {parseInt(book.available_copies) > 0 && (
                            <button
                              onClick={() => setIssueModal(book)}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                            >
                              Issue
                            </button>
                          )}
                          <button
                            onClick={() => setModal(book)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this book?"))
                                deleteMutation.mutate(book.id);
                            }}
                            className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── ISSUED TAB ── */}
      {tab === "issued" &&
        (issuedLoading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Book</th>
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Issue Date</th>
                  <th className="text-left px-5 py-3">Due Date</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issuedBooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No books currently issued.
                    </td>
                  </tr>
                )}
                {issuedBooks.map((issue) => (
                  <tr
                    key={issue.id}
                    className={`hover:bg-gray-50 ${issue.is_overdue ? "bg-red-50/30" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {issue.book_title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {issue.book_author}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800">{issue.student_name}</p>
                      <p className="text-xs text-gray-400">
                        {issue.class_name} {issue.section}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(issue.issue_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          issue.is_overdue
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }
                      >
                        {new Date(issue.due_date).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {issue.is_overdue ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Overdue — ₹{parseFloat(issue.current_fine).toFixed(2)}{" "}
                          fine
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {issue.days_remaining >= 0
                            ? `${issue.days_remaining}d left`
                            : "Due today"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setReturnModal(issue)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* ── OVERDUE TAB ── */}
      {tab === "overdue" &&
        (overdueLoading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <>
            {overdueData?.count > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs text-red-500">Overdue Books</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {overdueData.count}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs text-orange-500">Total Accrued Fine</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ₹{parseFloat(overdueData.total_fine).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3">Book</th>
                    <th className="text-left px-5 py-3">Student</th>
                    <th className="text-left px-5 py-3">Due Date</th>
                    <th className="text-center px-4 py-3">Overdue Days</th>
                    <th className="text-right px-5 py-3">Fine</th>
                    <th className="text-left px-5 py-3">Contact</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!overdueData?.records ||
                    overdueData.records.length === 0) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-gray-400"
                      >
                        No overdue books!
                      </td>
                    </tr>
                  )}
                  {overdueData?.records?.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {issue.book_title}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-800">{issue.student_name}</p>
                        <p className="text-xs text-gray-400">
                          {issue.class_name} {issue.section}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-red-600 font-medium">
                        {new Date(issue.due_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center text-red-600 font-bold">
                        {issue.overdue_days}
                      </td>
                      <td className="px-5 py-3 text-right text-red-600 font-bold">
                        ₹{parseFloat(issue.accrued_fine).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {issue.guardian_phone || issue.guardian_email || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setReturnModal(issue)}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ))}

      {/* Modals */}
      {modal && (
        <BookModal
          onClose={() => setModal(null)}
          existing={modal === "add" ? null : modal}
        />
      )}
      {issueModal && (
        <IssueModal onClose={() => setIssueModal(null)} book={issueModal} />
      )}
      {returnModal && (
        <ReturnModal onClose={() => setReturnModal(null)} issue={returnModal} />
      )}
    </div>
  );
}
