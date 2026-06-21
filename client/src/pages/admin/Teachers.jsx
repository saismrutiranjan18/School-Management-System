import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  setTeacherStatus,
} from "../../api/teachers.api";
import DashboardLayout from "../../components/DashboardLayout";

// ── Add Teacher Modal ─────────────────────────────────────────────────
function AddTeacherModal({ onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    qualification: "", joining_date: new Date().toISOString().split("T")[0],
    salary: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Teacher</h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); setError(""); mutation.mutate(form); }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Qualification</label>
            <input
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              placeholder="e.g. M.Sc Mathematics, B.Ed"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Joining Date</label>
              <input
                type="date"
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Salary (₹/mo)</label>
              <input
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {mutation.isPending ? "Creating..." : "Create Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Teacher Modal ────────────────────────────────────────────────
function EditTeacherModal({ onClose, teacher }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name:          teacher.name || "",
    qualification: teacher.qualification || "",
    joining_date:  teacher.joining_date?.split("T")[0] || "",
    salary:        teacher.salary || "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) => updateTeacher(teacher.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-1">Edit Teacher</h2>
        <p className="text-sm text-gray-500 mb-4">{teacher.email}</p>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); setError(""); mutation.mutate(form); }}
          className="space-y-3"
        >
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
            <label className="text-sm font-medium text-gray-700">Qualification</label>
            <input
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Joining Date</label>
              <input
                type="date"
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Salary (₹/mo)</label>
              <input
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
export default function Teachers() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | teacherObj
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setTeacherStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (err) => alert(err.response?.data?.error || "Failed to update status."),
  });

  const handleToggleStatus = (teacher) => {
    const msg = teacher.is_active
      ? `Deactivate ${teacher.name}? They will lose login access immediately. All attendance/marks/timetable history stays intact, and this is reversible any time.`
      : `Reactivate ${teacher.name}'s account?`;
    if (confirm(msg)) {
      statusMutation.mutate({ id: teacher.id, is_active: !teacher.is_active });
    }
  };

  const filtered = teachers.filter((t) => {
    if (filterStatus === "active" && !t.is_active) return false;
    if (filterStatus === "inactive" && t.is_active) return false;
    if (search && !`${t.name} ${t.email} ${t.qualification || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount   = teachers.filter((t) => t.is_active).length;
  const inactiveCount = teachers.filter((t) => !t.is_active).length;

  return (
    <DashboardLayout title="Teachers">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Teachers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage teaching staff accounts
            </p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Teacher
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Teachers</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{teachers.length}</p>
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
            placeholder="Search name, email, qualification..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <p className="text-gray-400 text-sm">Loading teachers...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Teacher</th>
                  <th className="text-left px-5 py-3">Qualification</th>
                  <th className="text-left px-5 py-3">Joining Date</th>
                  <th className="text-right px-5 py-3">Salary</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className={`hover:bg-gray-50 ${!t.is_active ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.email}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{t.qualification || "—"}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {t.joining_date ? new Date(t.joining_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {t.salary ? `₹${parseFloat(t.salary).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                          {t.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal(t)}
                            className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`text-xs px-3 py-1 border rounded-lg ${
                              t.is_active
                                ? "border-red-200 text-red-500 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {t.is_active ? "Deactivate" : "Reactivate"}
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
        {modal === "add" && <AddTeacherModal onClose={() => setModal(null)} />}
        {modal && modal !== "add" && (
          <EditTeacherModal teacher={modal} onClose={() => setModal(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}