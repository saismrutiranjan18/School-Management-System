import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchParents,
  createParent,
  updateParent,
  setParentStatus,
} from "../../api/parents.api";
import DashboardLayout from "../../components/DashboardLayout";

// ── Add Parent Modal ──────────────────────────────────────────────────
function AddParentModal({ onClose }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [linkResult, setLinkResult] = useState(null);

  const mutation = useMutation({
    mutationFn: createParent,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      setLinkResult(data.linked_student);
      if (!data.linked_student) return; // keep modal open to show the warning
      setTimeout(onClose, 1400);
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-1">Add Parent Account</h2>
        <p className="text-sm text-gray-500 mb-4">
          The email must match the guardian email already entered on the student's
          record for the portal to link automatically.
        </p>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        {linkResult !== null && (
          linkResult ? (
            <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded-lg">
              ✓ Linked to student <strong>{linkResult}</strong>. Closing…
            </p>
          ) : (
            <p className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
              Account created, but no student's guardian email matches <strong>{form.email}</strong> yet.
              Edit the student's guardian email on the Students page to link them.
            </p>
          )
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
            <label className="text-sm font-medium text-gray-700">Email (must match guardian email)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Temporary Password</label>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              {linkResult !== null ? "Close" : "Cancel"}
            </button>
            {linkResult === null && (
              <button type="submit" disabled={mutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {mutation.isPending ? "Creating..." : "Create Parent Account"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Parent Modal ─────────────────────────────────────────────────
function EditParentModal({ onClose, parent }) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name:  parent.name || "",
    email: parent.email || "",
    phone: parent.phone || "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) => updateParent(parent.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Parent</h2>

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
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Changing this automatically updates the matching student's guardian email so the link isn't lost.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Parents() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | parentObj
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterLinked, setFilterLinked] = useState("");

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: fetchParents,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => setParentStatus(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parents"] }),
    onError: (err) => alert(err.response?.data?.error || "Failed to update status."),
  });

  const handleToggleStatus = (parent) => {
    const msg = parent.is_active
      ? `Deactivate ${parent.name}? They will lose portal access immediately. Message history stays intact and this is reversible any time.`
      : `Reactivate ${parent.name}'s account?`;
    if (confirm(msg)) {
      statusMutation.mutate({ id: parent.id, is_active: !parent.is_active });
    }
  };

  const filtered = parents.filter((p) => {
    if (filterStatus === "active" && !p.is_active) return false;
    if (filterStatus === "inactive" && p.is_active) return false;
    if (filterLinked === "linked" && !p.student_id) return false;
    if (filterLinked === "unlinked" && p.student_id) return false;
    if (search && !`${p.name} ${p.email} ${p.student_name || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount   = parents.filter((p) => p.is_active).length;
  const linkedCount   = parents.filter((p) => p.student_id).length;
  const unlinkedCount = parents.length - linkedCount;

  return (
    <DashboardLayout title="Parents">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Parents</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage guardian portal accounts and student linkage
            </p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Parent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Parents</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{parents.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-green-600">Active</p>
            <p className="text-2xl font-semibold text-green-700 mt-1">{activeCount}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-600">Linked to a Student</p>
            <p className="text-2xl font-semibold text-blue-700 mt-1">{linkedCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-xs text-yellow-600">Unlinked</p>
            <p className="text-2xl font-semibold text-yellow-700 mt-1">{unlinkedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, child's name..."
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
          <select
            value={filterLinked}
            onChange={(e) => setFilterLinked(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="linked">Linked only</option>
            <option value="unlinked">Unlinked only</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading parents...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Parent</th>
                  <th className="text-left px-5 py-3">Linked Child</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      No parents found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        {p.student_id ? (
                          <>
                            <p className="text-gray-800">{p.student_name}</p>
                            <p className="text-xs text-gray-400">{p.class_name} — {p.section}</p>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                            Not linked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}>
                          {p.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal(p)}
                            className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`text-xs px-3 py-1 border rounded-lg ${
                              p.is_active
                                ? "border-red-200 text-red-500 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {p.is_active ? "Deactivate" : "Reactivate"}
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
        {modal === "add" && <AddParentModal onClose={() => setModal(null)} />}
        {modal && modal !== "add" && (
          <EditParentModal parent={modal} onClose={() => setModal(null)} />
        )}
      </div>
    </DashboardLayout>
  );
}