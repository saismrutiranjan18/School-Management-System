import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  setStudentStatus,
} from "../../api/students.api";
import { fetchClasses } from "../../api/classes.api";
import DashboardLayout from "../../components/DashboardLayout";

// ── Add Student Modal ─────────────────────────────────────────────────
function AddStudentModal({ onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    roll_no: "", class_id: "", dob: "", gender: "",
    address: "", guardian_name: "", guardian_phone: "", guardian_email: "",
  });
  const [error, setError] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Add New Student</h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Roll No</label>
              <input
                value={form.roll_no}
                onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Login Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Temporary Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="Student can change it later"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Class</label>
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">DOB</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Guardian / Parent
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                placeholder="Guardian name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                placeholder="Guardian phone"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={form.guardian_email}
                onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
                placeholder="Guardian email"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              This guardian email links the parent's portal account to this student. Create the
              matching parent login from the Parents page.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Student Modal ────────────────────────────────────────────────
function EditStudentModal({ onClose, student }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    roll_no:        student.roll_no || "",
    class_id:       student.class_id || "",
    dob:            student.dob?.split("T")[0] || "",
    gender:         student.gender || "",
    address:        student.address || "",
    guardian_name:  student.guardian_name || "",
    guardian_phone: student.guardian_phone || "",
    guardian_email: student.guardian_email || "",
  });
  const [error, setError] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const mutation = useMutation({
    mutationFn: (data) => updateStudent(student.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Edit Student</h2>
        <p className="text-sm text-gray-500 mb-4">{student.name} — {student.email}</p>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); setError(""); mutation.mutate(form); }}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Roll No</label>
              <input
                value={form.roll_no}
                onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Class</label>
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Guardian / Parent
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={form.guardian_name}
                onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                placeholder="Guardian name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.guardian_phone}
                onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                placeholder="Guardian phone"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={form.guardian_email}
                onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
                placeholder="Guardian email"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Students() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | studentObj
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setStudentStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
    onError: (err) => alert(err.response?.data?.error || "Failed to update status."),
  });

  const handleToggleStatus = (student) => {
    const action = student.is_active ? "deactivate" : "reactivate";
    const msg = student.is_active
      ? `Deactivate ${student.name}? They will lose login access immediately. All attendance, marks, and fee records stay intact, and this can be reversed any time.`
      : `Reactivate ${student.name}'s account?`;
    if (confirm(msg)) {
      statusMutation.mutate({ id: student.id, is_active: !student.is_active });
    }
  };

  const filtered = students.filter((s) => {
    if (filterClass && String(s.class_id) !== filterClass) return false;
    if (filterStatus === "active" && !s.is_active) return false;
    if (filterStatus === "inactive" && s.is_active) return false;
    if (search && !`${s.name} ${s.email} ${s.roll_no}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = students.filter((s) => s.is_active).length;
  const inactiveCount = students.filter((s) => !s.is_active).length;

  return (
    <DashboardLayout title="Students">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage student accounts and guardian details
            </p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Student
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-green-600">Active</p>
            <p className="text-2xl font-semibold text-green-700 mt-1">{activeCount}</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Deactivated</p>
            <p className="text-2xl font-semibold text-gray-600 mt-1">{inactiveCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, roll no..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active only</option>
            <option value="inactive">Deactivated only</option>
            <option value="">All</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading students...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Class</th>
                  <th className="text-left px-5 py-3">Roll No</th>
                  <th className="text-left px-5 py-3">Guardian</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className={`hover:bg-gray-50 ${!s.is_active ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {s.class_name ? `${s.class_name} — ${s.section}` : <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{s.roll_no || "—"}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {s.guardian_name || "—"}
                        {s.guardian_email && (
                          <p className="text-gray-400">{s.guardian_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                          {s.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal(s)}
                            className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`text-xs px-3 py-1 border rounded-lg ${
                              s.is_active
                                ? "border-red-200 text-red-500 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {s.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modals */}
        {modal === "add" && <AddStudentModal onClose={() => setModal(null)} />}
        {modal && modal !== "add" && (
          <EditStudentModal student={modal} onClose={() => setModal(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}