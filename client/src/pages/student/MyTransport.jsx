import { useSelector } from 'react-redux'
import { useQuery }    from '@tanstack/react-query'
import { fetchStudentTransport } from '../../api/transport.api'
import api from '../../api/axios'

const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  route:   ['M3 12h18','M3 6h18','M3 18h18'],
  bus:     ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z','M18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  driver:  ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  mapPin:  ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z','M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  clock:   ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 6v6l4 2'],
  phone:   ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 10a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.1 1.11h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z'],
  nobus:   ['M1 3h15v13H1z','M16 8h4l3 3v5h-7V8z','M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z','M18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
}

export default function MyTransport() {
  const { user } = useSelector(state => state.auth)

  const { data: studentRecord } = useQuery({
    queryKey: ['my-student-record', user?.id],
    queryFn:  () => api.get('/students').then(r =>
      r.data.find(s => s.email === user?.email)
    ),
    enabled: !!user,
  })

  const { data: transport, isLoading } = useQuery({
    queryKey: ['my-transport', studentRecord?.id],
    queryFn:  () => fetchStudentTransport(studentRecord.id),
    enabled:  !!studentRecord?.id,
  })

  if (isLoading) return (
    <p className="p-8 text-gray-400 text-sm">Loading transport details…</p>
  )

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Transport</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your school bus route details</p>
      </div>

      {!transport ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-3 text-gray-300">
            <Icon d={ICONS.nobus} size={48} />
          </div>
          <p className="text-sm text-gray-500">No transport assigned.</p>
          <p className="text-xs text-gray-400 mt-1">
            Contact the school office for transport allocation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Route card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Icon d={ICONS.mapPin} size={22} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">{transport.route_name}</p>
                <p className="text-sm text-gray-400">
                  {transport.start_point} → {transport.end_point}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Boarding Stop', value: transport.stop_name  || 'Not set',  icon: ICONS.mapPin },
                { label: 'Pickup Time',   value: transport.pickup_time ? transport.pickup_time.slice(0,5) : '—', icon: ICONS.clock },
                { label: 'Drop Time',     value: transport.drop_time   ? transport.drop_time.slice(0,5)   : '—', icon: ICONS.clock },
                { label: 'Landmark',      value: transport.landmark   || '—',         icon: ICONS.route  },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon d={item.icon} size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle card */}
          {transport.vehicle_no && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <Icon d={ICONS.bus} size={22} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{transport.vehicle_no}</p>
                  <p className="text-sm text-gray-400">
                    {transport.vehicle_type} · {transport.capacity} seats
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Driver card */}
          {transport.driver_name && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <Icon d={ICONS.driver} size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{transport.driver_name}</p>
                  <p className="text-sm text-gray-400">{transport.driver_phone}</p>
                </div>
                <a
                  href={`tel:${transport.driver_phone}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white
                             text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Icon d={ICONS.phone} size={14} className="text-white" />
                  Call
                </a>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}