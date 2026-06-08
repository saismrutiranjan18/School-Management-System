import api from './axios'

// Routes
export const fetchRoutes        = ()           => api.get('/transport/routes').then(r => r.data)
export const fetchRouteById     = (id)         => api.get(`/transport/routes/${id}`).then(r => r.data)
export const createRoute        = (data)       => api.post('/transport/routes', data).then(r => r.data)
export const updateRoute        = (id, data)   => api.put(`/transport/routes/${id}`, data).then(r => r.data)
export const deleteRoute        = (id)         => api.delete(`/transport/routes/${id}`).then(r => r.data)

// Stops
export const addStop            = (routeId, data) => api.post(`/transport/routes/${routeId}/stops`, data).then(r => r.data)
export const deleteStop         = (routeId, stopId) => api.delete(`/transport/routes/${routeId}/stops/${stopId}`).then(r => r.data)

// Vehicles
export const fetchVehicles      = ()           => api.get('/transport/vehicles').then(r => r.data)
export const createVehicle      = (data)       => api.post('/transport/vehicles', data).then(r => r.data)
export const updateVehicle      = (id, data)   => api.put(`/transport/vehicles/${id}`, data).then(r => r.data)
export const deleteVehicle      = (id)         => api.delete(`/transport/vehicles/${id}`).then(r => r.data)

// Drivers
export const fetchDrivers       = ()           => api.get('/transport/drivers').then(r => r.data)
export const createDriver       = (data)       => api.post('/transport/drivers', data).then(r => r.data)
export const updateDriver       = (id, data)   => api.put(`/transport/drivers/${id}`, data).then(r => r.data)
export const deleteDriver       = (id)         => api.delete(`/transport/drivers/${id}`).then(r => r.data)

// Allocation
export const assignStudent      = (data)       => api.post('/transport/assign', data).then(r => r.data)
export const removeStudent      = (id)         => api.delete(`/transport/assign/${id}`).then(r => r.data)
export const fetchStudentTransport = (studentId) => api.get(`/transport/student/${studentId}`).then(r => r.data)