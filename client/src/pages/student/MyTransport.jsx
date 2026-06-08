import { useSelector } from 'react-redux'
import { useQuery }    from '@tanstack/react-query'
import { fetchStudentTransport } from '../../api/transport.api'
import api from '../../api/axios'

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
    <p className="p-8 text-gray-400 text-sm">Loading transport details...</p>
  )

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Transport</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your school bus route details</p>
      </div>

      {!transport ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🚌</p>
          <p className="text-sm text-gray-500">No transport assigned.</p>
          <p className="text-xs text-gray-400 mt-1">Contact the school office for transport allocation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Route card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🗺️</div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">{transport.route_name}</p>
                <p className="text-sm text-gray-400">
                  {transport.start_point} → {transport.end_point}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Boarding Stop',  value: transport.stop_name  || 'Not set' },
                { label: 'Pickup Time',    value: transport.pickup_time ? transport.pickup_time.slice(0,5) : '—' },
                { label: 'Drop Time',      value: transport.drop_time   ? transport.drop_time.slice(0,5)   : '—' },
                { label: 'Landmark',       value: transport.landmark   || '—' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle card */}
          {transport.vehicle_no && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🚌</div>
                <div>
                  <p className="font-semibold text-gray-800">{transport.vehicle_no}</p>
                  <p className="text-sm text-gray-400">{transport.vehicle_type} · {transport.capacity} seats</p>
                </div>
              </div>
            </div>
          )}

          {/* Driver card */}
          {transport.driver_name && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">👨‍✈️</div>
                <div>
                  <p className="font-semibold text-gray-800">{transport.driver_name}</p>
                  <p className="text-sm text-gray-400">{transport.driver_phone}</p>
                </div>
                <a href={`tel:${transport.driver_phone}`}
                  className="ml-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                  📞 Call
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}