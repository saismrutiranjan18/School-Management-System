import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { fetchStudentTransport } from '../../api/transport.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { MapPin, Clock, Bus, User, Phone, Route } from 'lucide-react'

export default function MyTransport() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn: () => api.get('/students').then(r => r.data.find(s => s.email === user?.email)),
    enabled: !!user,
  })

  const { data: transport, isLoading } = useQuery({
    queryKey: ['my-transport', studentRecord?.id],
    queryFn: () => fetchStudentTransport(studentRecord.id),
    enabled: !!studentRecord?.id,
  })

  return (
    <DashboardLayout title="My Transport">
      <div className="p-6 space-y-6 max-w-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">My Transport</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your school bus route details</p>
        </div>

        {isLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading transport details…</p></Card>
        ) : !transport ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Bus size={48} className="opacity-30" />
              <p className="text-sm">No transport assigned</p>
              <p className="text-xs">Contact the school office for transport allocation.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Route card */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{transport.route_name}</p>
                  <p className="text-sm text-slate-400">{transport.start_point} → {transport.end_point}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Boarding Stop', value: transport.stop_name || 'Not set', icon: MapPin },
                  { label: 'Pickup Time', value: transport.pickup_time ? transport.pickup_time.slice(0, 5) : '—', icon: Clock },
                  { label: 'Drop Time', value: transport.drop_time ? transport.drop_time.slice(0, 5) : '—', icon: Clock },
                  { label: 'Landmark', value: transport.landmark || '—', icon: Route },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-start gap-2.5">
                    <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Vehicle */}
            {transport.vehicle_no && (
              <Card className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                  <Bus size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{transport.vehicle_no}</p>
                  <p className="text-sm text-slate-400">{transport.vehicle_type} · {transport.capacity} seats</p>
                </div>
              </Card>
            )}

            {/* Driver */}
            {transport.driver_name && (
              <Card className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0">
                  <User size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{transport.driver_name}</p>
                  <p className="text-sm text-slate-400">{transport.driver_phone}</p>
                </div>
                <a href={`tel:${transport.driver_phone}`}>
                  <Button variant="success" size="sm" leftIcon={<Phone size={13} />}>Call</Button>
                </a>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}