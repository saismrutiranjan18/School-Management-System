import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  fetchRouteById,
  assignStudent,
  removeStudent,
  addStop,
  deleteStop,
} from "../../api/transport.api";
import api from "../../api/axios";

// ── Reusable field component ───────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

const Input = ({ ...props }) => (
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  />
);

const Select = ({ children, ...props }) => (
  <select
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  >
    {children}
  </select>
);

// ── Route Modal ────────────────────────────────────────────────────────
function RouteModal({ onClose, existing }) {
  const qc = useQueryClient();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name || "",
    description: existing?.description || "",
    start_point: existing?.start_point || "",
    end_point: existing?.end_point || "",
    distance_km: existing?.distance_km || "",
  });
  const [stops, setStops] = useState([
    {
      stop_name: "",
      stop_order: 1,
      pickup_time: "",
      drop_time: "",
      landmark: "",
    },
  ]);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateRoute(existing.id, data) : createRoute(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  const addStopRow = () =>
    setStops((prev) => [
      ...prev,
      {
        stop_name: "",
        stop_order: prev.length + 1,
        pickup_time: "",
        drop_time: "",
        landmark: "",
      },
    ]);

  const removeStopRow = (i) =>
    setStops((prev) => prev.filter((_, idx) => idx !== i));

  const updateStop = (i, field, val) =>
    setStops((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)),
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate({
      ...form,
      stops: isEdit ? undefined : stops.filter((s) => s.stop_name),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Route" : "Add Route"}
        </h2>

        {error && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Route Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Route 1 — North Zone"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Point">
              <Input
                value={form.start_point}
                onChange={(e) =>
                  setForm({ ...form, start_point: e.target.value })
                }
                placeholder="e.g. School Gate"
              />
            </Field>
            <Field label="End Point">
              <Input
                value={form.end_point}
                onChange={(e) =>
                  setForm({ ...form, end_point: e.target.value })
                }
                placeholder="e.g. City Center"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Distance (km)">
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.distance_km}
                onChange={(e) =>
                  setForm({ ...form, distance_km: e.target.value })
                }
                placeholder="e.g. 12.5"
              />
            </Field>
            <Field label="Description">
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional notes"
              />
            </Field>
          </div>

          {/* Stops — only for new routes */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Stops
                </label>
                <button
                  type="button"
                  onClick={addStopRow}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add Stop
                </button>
              </div>
              <div className="space-y-2">
                {stops.map((stop, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                    <input
                      value={stop.stop_name}
                      onChange={(e) =>
                        updateStop(i, "stop_name", e.target.value)
                      }
                      placeholder="Stop name"
                      className="col-span-2 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="time"
                      value={stop.pickup_time}
                      onChange={(e) =>
                        updateStop(i, "pickup_time", e.target.value)
                      }
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      value={stop.landmark}
                      onChange={(e) =>
                        updateStop(i, "landmark", e.target.value)
                      }
                      placeholder="Landmark"
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeStopRow(i)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vehicle Modal ──────────────────────────────────────────────────────
function VehicleModal({ onClose, existing }) {
  const qc = useQueryClient();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    vehicle_no: existing?.vehicle_no || "",
    vehicle_type: existing?.vehicle_type || "Bus",
    capacity: existing?.capacity || "",
    model: existing?.model || "",
    route_id: existing?.route_id || "",
    insurance_expiry: existing?.insurance_expiry?.split("T")[0] || "",
    fitness_expiry: existing?.fitness_expiry?.split("T")[0] || "",
  });
  const [error, setError] = useState("");

  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: fetchRoutes,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateVehicle(existing.id, data) : createVehicle(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Vehicle" : "Add Vehicle"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle Number">
              <Input
                value={form.vehicle_no}
                onChange={(e) =>
                  setForm({ ...form, vehicle_no: e.target.value.toUpperCase() })
                }
                placeholder="e.g. MH12AB1234"
                required
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.vehicle_type}
                onChange={(e) =>
                  setForm({ ...form, vehicle_type: e.target.value })
                }
              >
                {["Bus", "Van", "Auto", "Mini Bus"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity (seats)">
              <Input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </Field>
            <Field label="Model">
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. Tata Starbus"
              />
            </Field>
          </div>

          <Field label="Assign Route">
            <Select
              value={form.route_id}
              onChange={(e) => setForm({ ...form, route_id: e.target.value })}
            >
              <option value="">-- No Route --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Insurance Expiry">
              <Input
                type="date"
                value={form.insurance_expiry}
                onChange={(e) =>
                  setForm({ ...form, insurance_expiry: e.target.value })
                }
              />
            </Field>
            <Field label="Fitness Expiry">
              <Input
                type="date"
                value={form.fitness_expiry}
                onChange={(e) =>
                  setForm({ ...form, fitness_expiry: e.target.value })
                }
              />
            </Field>
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
                  : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Driver Modal ───────────────────────────────────────────────────────
function DriverModal({ onClose, existing }) {
  const qc = useQueryClient();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name || "",
    phone: existing?.phone || "",
    license_no: existing?.license_no || "",
    license_expiry: existing?.license_expiry?.split("T")[0] || "",
    address: existing?.address || "",
    vehicle_id: existing?.vehicle_id || "",
  });
  const [error, setError] = useState("");

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateDriver(existing.id, data) : createDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Something went wrong."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Driver" : "Add Driver"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Driver full name"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="e.g. 9876543210"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="License Number">
              <Input
                value={form.license_no}
                onChange={(e) =>
                  setForm({ ...form, license_no: e.target.value })
                }
                required
                placeholder="e.g. MH1220230012345"
              />
            </Field>
            <Field label="License Expiry">
              <Input
                type="date"
                value={form.license_expiry}
                onChange={(e) =>
                  setForm({ ...form, license_expiry: e.target.value })
                }
              />
            </Field>
          </div>

          <Field label="Assign Vehicle">
            <Select
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            >
              <option value="">-- No Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_no} ({v.vehicle_type})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Address">
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Driver address"
            />
          </Field>

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
                  : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Route Detail Panel ─────────────────────────────────────────────────
function RouteDetail({ routeId, onClose }) {
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStop, setSelectedStop] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["route-detail", routeId],
    queryFn: () => fetchRouteById(routeId),
    enabled: !!routeId,
  });

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

  const assignMutation = useMutation({
    mutationFn: assignStudent,
    onSuccess: () => {
      refetch();
      setSelectedStudent(null);
      setStudentSearch("");
      setSelectedStop("");
      setAssigning(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeStudent,
    onSuccess: () => refetch(),
  });

  if (isLoading)
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-gray-400 text-sm">
          Loading...
        </div>
      </div>
    );

  const { route, stops, students } = data || {};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {route?.name}
            </h2>
            <p className="text-sm text-gray-400">
              {route?.start_point} → {route?.end_point}
              {route?.distance_km && ` · ${route.distance_km} km`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Stops */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Stops ({stops?.length || 0})
          </p>
          {stops?.length === 0 ? (
            <p className="text-xs text-gray-400">No stops added.</p>
          ) : (
            <div className="space-y-1">
              {stops?.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {stop.stop_order}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">
                      {stop.stop_name}
                    </span>
                    {stop.landmark && (
                      <span className="text-gray-400 ml-2 text-xs">
                        {stop.landmark}
                      </span>
                    )}
                  </div>
                  {stop.pickup_time && (
                    <span className="text-xs text-blue-600 font-medium">
                      🕐 {stop.pickup_time.slice(0, 5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign student */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Students ({students?.length || 0})
            </p>
            <button
              onClick={() => setAssigning(!assigning)}
              className="text-xs text-blue-600 hover:underline"
            >
              {assigning ? "Cancel" : "+ Assign Student"}
            </button>
          </div>

          {assigning && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 space-y-2">
              <div className="relative">
                <input
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                  placeholder="Search student..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs border-b border-gray-50 last:border-0"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-gray-400 ml-2">
                          {s.class_name} {s.section}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={selectedStop}
                onChange={(e) => setSelectedStop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Boarding Stop --</option>
                {stops?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stop_name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!selectedStudent) return;
                  assignMutation.mutate({
                    student_id: selectedStudent.id,
                    route_id: routeId,
                    stop_id: selectedStop || null,
                  });
                }}
                disabled={!selectedStudent || assignMutation.isPending}
                className="w-full py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assigning..." : "Assign to Route"}
              </button>
            </div>
          )}

          {/* Students list */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {students?.length === 0 ? (
              <p className="text-xs text-gray-400">
                No students assigned to this route.
              </p>
            ) : (
              students?.map((s) => (
                <div
                  key={s.allocation_id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.class_name} {s.section}
                      {s.stop_name && ` · Boards at ${s.stop_name}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Remove student from this route?"))
                        removeMutation.mutate(s.allocation_id);
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Transport Page ────────────────────────────────────────────────
export default function Transport() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("routes");
  const [routeModal, setRouteModal] = useState(null);
  const [vehicleModal, setVehicleModal] = useState(null);
  const [driverModal, setDriverModal] = useState(null);
  const [detailRoute, setDetailRoute] = useState(null);

  const { data: routes = [], isLoading: rl } = useQuery({
    queryKey: ["routes"],
    queryFn: fetchRoutes,
  });
  const { data: vehicles = [], isLoading: vl } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });
  const { data: drivers = [], isLoading: dl } = useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

  const deleteRouteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
    onError: (e) => alert(e.response?.data?.error || "Failed"),
  });
  const deleteVehicleMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
  const deleteDriverMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });

  const expiryWarning = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    if (days < 0)
      return <span className="text-xs text-red-600 font-medium">Expired!</span>;
    if (days < 30)
      return (
        <span className="text-xs text-orange-600 font-medium">
          Expires in {days}d
        </span>
      );
    return null;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Transport</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Routes, vehicles, drivers and student allocation
          </p>
        </div>
        <div>
          {tab === "routes" && (
            <button
              onClick={() => setRouteModal("add")}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              + Add Route
            </button>
          )}
          {tab === "vehicles" && (
            <button
              onClick={() => setVehicleModal("add")}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              + Add Vehicle
            </button>
          )}
          {tab === "drivers" && (
            <button
              onClick={() => setDriverModal("add")}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              + Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Routes", value: routes.length },
          { label: "Total Vehicles", value: vehicles.length },
          { label: "Total Drivers", value: drivers.length },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "routes", label: "🗺️ Routes" },
          { key: "vehicles", label: "🚌 Vehicles" },
          { key: "drivers", label: "👨‍✈️ Drivers" },
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

      {/* ── ROUTES TAB ── */}
      {tab === "routes" &&
        (rl ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="space-y-3">
            {routes.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-12">
                No routes added yet.
              </p>
            )}
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{route.name}</p>
                    <p className="text-xs text-gray-400">
                      {route.start_point &&
                        `${route.start_point} → ${route.end_point}`}
                      {route.distance_km && ` · ${route.distance_km}km`}
                    </p>
                    {route.vehicle_no && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        🚌 {route.vehicle_no} ({route.vehicle_type}) · 👨‍✈️{" "}
                        {route.driver_name || "No driver"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {route.student_count} students
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      route.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {route.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => setDetailRoute(route.id)}
                    className="text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => setRouteModal(route)}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete route?"))
                        deleteRouteMutation.mutate(route.id);
                    }}
                    className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* ── VEHICLES TAB ── */}
      {tab === "vehicles" &&
        (vl ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Vehicle</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-center px-4 py-3">Capacity</th>
                  <th className="text-left px-5 py-3">Route</th>
                  <th className="text-left px-5 py-3">Driver</th>
                  <th className="text-left px-5 py-3">Documents</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No vehicles added.
                    </td>
                  </tr>
                )}
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-mono font-semibold text-gray-800">
                        {v.vehicle_no}
                      </p>
                      <p className="text-xs text-gray-400">{v.model || "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {v.capacity}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {v.route_name || "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {v.driver_name || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Ins:</span>
                          <span>
                            {v.insurance_expiry
                              ? new Date(v.insurance_expiry).toLocaleDateString(
                                  "en-IN",
                                )
                              : "—"}
                          </span>
                          {expiryWarning(v.insurance_expiry)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Fit:</span>
                          <span>
                            {v.fitness_expiry
                              ? new Date(v.fitness_expiry).toLocaleDateString(
                                  "en-IN",
                                )
                              : "—"}
                          </span>
                          {expiryWarning(v.fitness_expiry)}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setVehicleModal(v)}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete vehicle?"))
                              deleteVehicleMutation.mutate(v.id);
                          }}
                          className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
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
        ))}

      {/* ── DRIVERS TAB ── */}
      {tab === "drivers" &&
        (dl ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Driver</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">License</th>
                  <th className="text-left px-5 py-3">Vehicle</th>
                  <th className="text-left px-5 py-3">Route</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No drivers added.
                    </td>
                  </tr>
                )}
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {d.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{d.phone}</td>
                    <td className="px-5 py-3 text-xs">
                      <p className="font-mono text-gray-700">{d.license_no}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-gray-400">Exp:</span>
                        <span className="text-gray-600">
                          {d.license_expiry
                            ? new Date(d.license_expiry).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"}
                        </span>
                        {expiryWarning(d.license_expiry)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {d.vehicle_no || "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {d.route_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDriverModal(d)}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete driver?"))
                              deleteDriverMutation.mutate(d.id);
                          }}
                          className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
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
        ))}

      {/* Modals */}
      {routeModal && (
        <RouteModal
          onClose={() => setRouteModal(null)}
          existing={routeModal === "add" ? null : routeModal}
        />
      )}
      {vehicleModal && (
        <VehicleModal
          onClose={() => setVehicleModal(null)}
          existing={vehicleModal === "add" ? null : vehicleModal}
        />
      )}
      {driverModal && (
        <DriverModal
          onClose={() => setDriverModal(null)}
          existing={driverModal === "add" ? null : driverModal}
        />
      )}
      {detailRoute && (
        <RouteDetail
          routeId={detailRoute}
          onClose={() => setDetailRoute(null)}
        />
      )}
    </div>
  );
}
