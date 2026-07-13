import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchRoutes, createRoute, updateRoute, deleteRoute,
  fetchVehicles, createVehicle, updateVehicle, deleteVehicle,
  fetchDrivers, createDriver, updateDriver, deleteDriver,
  fetchRouteById, assignStudent, removeStudent, addStop, deleteStop,
} from '../../api/transport.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import {
  MapPin, Bus, User, Plus, Edit3, Trash2, Settings, Clock,
  Search, X, Route, Shield, FileText,
} from 'lucide-react'

/* ── Route Modal ── */
function RouteModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    name: existing?.name || '', description: existing?.description || '',
    start_point: existing?.start_point || '', end_point: existing?.end_point || '',
    distance_km: existing?.distance_km || '',
  })
  const [stops, setStops] = useState([{ stop_name: '', stop_order: 1, pickup_time: '', drop_time: '', landmark: '' }])
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateRoute(existing.id, data) : createRoute(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routes'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })

  const addStopRow = () => setStops(prev => [...prev, { stop_name: '', stop_order: prev.length + 1, pickup_time: '', drop_time: '', landmark: '' }])
  const removeStopRow = (i) => setStops(prev => prev.filter((_, idx) => idx !== i))
  const updateStop = (i, field, val) => setStops(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const handleSubmit = (e) => { e.preventDefault(); setError(''); mutation.mutate({ ...form, stops: isEdit ? undefined : stops.filter(s => s.stop_name) }) }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Route' : 'Add Route'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={mutation.isPending} onClick={handleSubmit}>{isEdit ? 'Update' : 'Create Route'}</Button></>}>
      {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-2 rounded-xl">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Route Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Route 1 — North Zone" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Point" value={form.start_point} onChange={e => setForm({ ...form, start_point: e.target.value })} placeholder="e.g. School Gate" />
          <Input label="End Point" value={form.end_point} onChange={e => setForm({ ...form, end_point: e.target.value })} placeholder="e.g. City Center" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Distance (km)" type="number" min="0" step="0.1" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} placeholder="e.g. 12.5" />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
        </div>
        {!isEdit && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stops</label>
              <button type="button" onClick={addStopRow} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">+ Add Stop</button>
            </div>
            <div className="space-y-2">
              {stops.map((stop, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input value={stop.stop_name} onChange={e => updateStop(i, 'stop_name', e.target.value)} placeholder="Stop name"
                    className="col-span-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                  <input type="time" value={stop.pickup_time} onChange={e => updateStop(i, 'pickup_time', e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                  <input value={stop.landmark} onChange={e => updateStop(i, 'landmark', e.target.value)} placeholder="Landmark"
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                  <button type="button" onClick={() => removeStopRow(i)} className="text-red-400 hover:text-red-600 text-xs"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

/* ── Vehicle Modal ── */
function VehicleModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    vehicle_no: existing?.vehicle_no || '', vehicle_type: existing?.vehicle_type || 'Bus',
    capacity: existing?.capacity || '', model: existing?.model || '', route_id: existing?.route_id || '',
    insurance_expiry: existing?.insurance_expiry?.split('T')[0] || '', fitness_expiry: existing?.fitness_expiry?.split('T')[0] || '',
  })
  const [error, setError] = useState('')
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: fetchRoutes })
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateVehicle(existing.id, data) : createVehicle(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={mutation.isPending} onClick={() => mutation.mutate(form)}>{isEdit ? 'Update' : 'Add Vehicle'}</Button></>}>
      {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-2 rounded-xl">{error}</p>}
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vehicle Number" value={form.vehicle_no} onChange={e => setForm({ ...form, vehicle_no: e.target.value.toUpperCase() })} placeholder="e.g. MH12AB1234" required />
          <Select label="Type" value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}>
            {['Bus','Van','Auto','Mini Bus'].map(t => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Capacity" type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required />
          <Input label="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="e.g. Tata Starbus" />
        </div>
        <Select label="Assign Route" value={form.route_id} onChange={e => setForm({ ...form, route_id: e.target.value })}>
          <option value="">-- No Route --</option>
          {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Insurance Expiry" type="date" value={form.insurance_expiry} onChange={e => setForm({ ...form, insurance_expiry: e.target.value })} />
          <Input label="Fitness Expiry" type="date" value={form.fitness_expiry} onChange={e => setForm({ ...form, fitness_expiry: e.target.value })} />
        </div>
      </form>
    </Modal>
  )
}

/* ── Driver Modal ── */
function DriverModal({ onClose, existing }) {
  const qc = useQueryClient()
  const isEdit = !!existing
  const [form, setForm] = useState({
    name: existing?.name || '', phone: existing?.phone || '', license_no: existing?.license_no || '',
    license_expiry: existing?.license_expiry?.split('T')[0] || '', address: existing?.address || '', vehicle_id: existing?.vehicle_id || '',
  })
  const [error, setError] = useState('')
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles })
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateDriver(existing.id, data) : createDriver(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); onClose() },
    onError: (err) => setError(err.response?.data?.error || 'Something went wrong.'),
  })
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Driver' : 'Add Driver'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={mutation.isPending} onClick={() => mutation.mutate(form)}>{isEdit ? 'Update' : 'Add Driver'}</Button></>}>
      {error && <p className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-2 rounded-xl">{error}</p>}
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Driver full name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="e.g. 9876543210" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="License Number" value={form.license_no} onChange={e => setForm({ ...form, license_no: e.target.value })} required placeholder="e.g. MH1220230012345" />
          <Input label="License Expiry" type="date" value={form.license_expiry} onChange={e => setForm({ ...form, license_expiry: e.target.value })} />
        </div>
        <Select label="Assign Vehicle" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
          <option value="">-- No Vehicle --</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_no} ({v.vehicle_type})</option>)}
        </Select>
        <Textarea label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Driver address" />
      </form>
    </Modal>
  )
}

/* ── Route Detail Panel ── */
function RouteDetail({ routeId, onClose }) {
  const qc = useQueryClient()
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStop, setSelectedStop] = useState('')
  const [assigning, setAssigning] = useState(false)

  const { data, isLoading, refetch } = useQuery({ queryKey: ['route-detail', routeId], queryFn: () => fetchRouteById(routeId), enabled: !!routeId })
  const { data: allStudents = [] } = useQuery({ queryKey: ['all-students-list'], queryFn: () => api.get('/students').then(r => r.data) })

  const filteredStudents = studentSearch.length >= 2 ? allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 6) : []
  const assignMutation = useMutation({ mutationFn: assignStudent, onSuccess: () => { refetch(); setSelectedStudent(null); setStudentSearch(''); setSelectedStop(''); setAssigning(false) } })
  const removeMutation = useMutation({ mutationFn: removeStudent, onSuccess: () => refetch() })

  const { route, stops, students } = data || {}

  return (
    <Modal open onClose={onClose} title={route?.name || 'Route Details'} subtitle={`${route?.start_point || ''} → ${route?.end_point || ''} ${route?.distance_km ? `· ${route.distance_km} km` : ''}`} size="lg"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      {isLoading ? <p className="text-sm text-slate-400 py-8 text-center">Loading…</p> : (
        <div className="space-y-5">
          {/* Stops */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Stops ({stops?.length || 0})</p>
            {stops?.length === 0 ? <p className="text-xs text-slate-400">No stops added.</p> : (
              <div className="space-y-1.5">
                {stops?.map(stop => (
                  <div key={stop.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
                    <span className="w-6 h-6 bg-gradient-to-br from-primary-500 to-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{stop.stop_order}</span>
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{stop.stop_name}</span>
                      {stop.landmark && <span className="text-slate-400 ml-2 text-xs">{stop.landmark}</span>}
                    </div>
                    {stop.pickup_time && (
                      <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
                        <Clock size={12} /> {stop.pickup_time.slice(0, 5)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign student */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Students ({students?.length || 0})</p>
              <button onClick={() => setAssigning(!assigning)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                {assigning ? 'Cancel' : '+ Assign Student'}
              </button>
            </div>

            {assigning && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 rounded-xl p-3 mb-3 space-y-2">
                <div className="relative">
                  <Input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null) }}
                    placeholder="Search student…" leftIcon={<Search size={14} />} />
                  {filteredStudents.length > 0 && !selectedStudent && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 mt-1 overflow-hidden">
                      {filteredStudents.map(s => (
                        <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(s.name) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{s.name}</span>
                          <span className="text-slate-400 ml-2 text-xs">{s.class_name} {s.section}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Select value={selectedStop} onChange={e => setSelectedStop(e.target.value)}>
                  <option value="">-- Select Boarding Stop --</option>
                  {stops?.map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
                </Select>
                <Button className="w-full" loading={assignMutation.isPending} disabled={!selectedStudent}
                  onClick={() => { if (selectedStudent) assignMutation.mutate({ student_id: selectedStudent.id, route_id: routeId, stop_id: selectedStop || null }) }}>
                  Assign to Route
                </Button>
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {students?.length === 0 ? <p className="text-xs text-slate-400">No students assigned.</p> : (
                students?.map(s => (
                  <div key={s.allocation_id} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.class_name} {s.section}{s.stop_name && ` · Boards at ${s.stop_name}`}</p>
                    </div>
                    <button onClick={() => { if (confirm('Remove student?')) removeMutation.mutate(s.allocation_id) }}
                      className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">Remove</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── Main Transport Page ── */
export default function Transport() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('routes')
  const [routeModal, setRouteModal] = useState(null)
  const [vehicleModal, setVehicleModal] = useState(null)
  const [driverModal, setDriverModal] = useState(null)
  const [detailRoute, setDetailRoute] = useState(null)

  const { data: routes = [], isLoading: rl } = useQuery({ queryKey: ['routes'], queryFn: fetchRoutes })
  const { data: vehicles = [], isLoading: vl } = useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles })
  const { data: drivers = [], isLoading: dl } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })

  const deleteRouteMutation = useMutation({ mutationFn: deleteRoute, onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }), onError: (e) => alert(e.response?.data?.error || 'Failed') })
  const deleteVehicleMutation = useMutation({ mutationFn: deleteVehicle, onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }) })
  const deleteDriverMutation = useMutation({ mutationFn: deleteDriver, onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }) })

  const expiryWarning = (dateStr) => {
    if (!dateStr) return null
    const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
    if (days < 0) return <Badge variant="danger">Expired!</Badge>
    if (days < 30) return <Badge variant="warning">Expires in {days}d</Badge>
    return null
  }

  return (
    <DashboardLayout title="Transport">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Transport</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Routes, vehicles, drivers and student allocation</p>
          </div>
          <div>
            {tab === 'routes' && <Button leftIcon={<Plus size={14} />} onClick={() => setRouteModal('add')}>Add Route</Button>}
            {tab === 'vehicles' && <Button leftIcon={<Plus size={14} />} onClick={() => setVehicleModal('add')}>Add Vehicle</Button>}
            {tab === 'drivers' && <Button leftIcon={<Plus size={14} />} onClick={() => setDriverModal('add')}>Add Driver</Button>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Routes', value: routes.length, icon: Route, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Total Vehicles', value: vehicles.length, icon: Bus, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Total Drivers', value: drivers.length, icon: User, gradient: 'from-orange-400 to-rose-500' },
          ].map((s, i) => (
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
          {[{ key: 'routes', label: 'Routes' }, { key: 'vehicles', label: 'Vehicles' }, { key: 'drivers', label: 'Drivers' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${tab === t.key ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ROUTES TAB ── */}
        {tab === 'routes' && (
          rl ? <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card> : (
            <div className="space-y-3">
              {routes.length === 0 && <Card><p className="text-sm text-slate-400 text-center py-12">No routes added yet.</p></Card>}
              {routes.map(route => (
                <Card key={route.id} hover className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{route.name}</p>
                      <p className="text-xs text-slate-400">
                        {route.start_point && `${route.start_point} → ${route.end_point}`}
                        {route.distance_km && ` · ${route.distance_km}km`}
                      </p>
                      {route.vehicle_no && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <Bus size={12} className="text-blue-500" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">{route.vehicle_no} ({route.vehicle_type})</span>
                          {route.driver_name && <><User size={12} className="text-slate-400" /><span className="text-xs text-slate-500 dark:text-slate-400">{route.driver_name}</span></>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{route.student_count} students</Badge>
                    <StatusBadge status={route.is_active ? 'active' : 'inactive'} />
                    <Button size="sm" leftIcon={<Settings size={11} />} onClick={() => setDetailRoute(route.id)}>Manage</Button>
                    <Button size="sm" variant="outline" leftIcon={<Edit3 size={11} />} onClick={() => setRouteModal(route)}>Edit</Button>
                    <Button size="sm" variant="danger" leftIcon={<Trash2 size={11} />}
                      onClick={() => { if (confirm('Delete route?')) deleteRouteMutation.mutate(route.id) }}>Del</Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ── VEHICLES TAB ── */}
        {tab === 'vehicles' && (
          vl ? <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card> : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
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
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {vehicles.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No vehicles added.</td></tr>}
                    {vehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">{v.vehicle_no}</p>
                          <p className="text-xs text-slate-400">{v.model || '—'}</p>
                        </td>
                        <td className="px-5 py-3"><Badge variant="info">{v.vehicle_type}</Badge></td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{v.capacity}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{v.route_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{v.driver_name || '—'}</td>
                        <td className="px-5 py-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1"><span className="text-slate-400">Ins:</span><span className="text-slate-600 dark:text-slate-300">{v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString('en-IN') : '—'}</span>{expiryWarning(v.insurance_expiry)}</div>
                            <div className="flex items-center gap-1"><span className="text-slate-400">Fit:</span><span className="text-slate-600 dark:text-slate-300">{v.fitness_expiry ? new Date(v.fitness_expiry).toLocaleDateString('en-IN') : '—'}</span>{expiryWarning(v.fitness_expiry)}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" leftIcon={<Edit3 size={11} />} onClick={() => setVehicleModal(v)}>Edit</Button>
                            <Button size="sm" variant="danger" leftIcon={<Trash2 size={11} />} onClick={() => { if (confirm('Delete vehicle?')) deleteVehicleMutation.mutate(v.id) }}>Del</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        )}

        {/* ── DRIVERS TAB ── */}
        {tab === 'drivers' && (
          dl ? <Card><p className="text-sm text-slate-400 text-center py-12">Loading…</p></Card> : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
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
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {drivers.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No drivers added.</td></tr>}
                    {drivers.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                              {d.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.phone}</td>
                        <td className="px-5 py-3 text-xs">
                          <p className="font-mono text-slate-700 dark:text-slate-300">{d.license_no}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400">Exp:</span>
                            <span className="text-slate-600 dark:text-slate-400">{d.license_expiry ? new Date(d.license_expiry).toLocaleDateString('en-IN') : '—'}</span>
                            {expiryWarning(d.license_expiry)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{d.vehicle_no || '—'}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">{d.route_name || '—'}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={d.is_active ? 'active' : 'inactive'} /></td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" leftIcon={<Edit3 size={11} />} onClick={() => setDriverModal(d)}>Edit</Button>
                            <Button size="sm" variant="danger" leftIcon={<Trash2 size={11} />} onClick={() => { if (confirm('Delete driver?')) deleteDriverMutation.mutate(d.id) }}>Del</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        )}

        {routeModal && <RouteModal onClose={() => setRouteModal(null)} existing={routeModal === 'add' ? null : routeModal} />}
        {vehicleModal && <VehicleModal onClose={() => setVehicleModal(null)} existing={vehicleModal === 'add' ? null : vehicleModal} />}
        {driverModal && <DriverModal onClose={() => setDriverModal(null)} existing={driverModal === 'add' ? null : driverModal} />}
        {detailRoute && <RouteDetail routeId={detailRoute} onClose={() => setDetailRoute(null)} />}
      </div>
    </DashboardLayout>
  )
}