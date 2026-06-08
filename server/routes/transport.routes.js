const express = require('express')
const router  = express.Router()
const { protect, authorizeRoles } = require('../middleware/auth.middleware')
const {
  getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute,
  addStop, deleteStop,
  getAllVehicles, createVehicle, updateVehicle, deleteVehicle,
  getAllDrivers, createDriver, updateDriver, deleteDriver,
  assignStudent, removeStudentFromRoute, getStudentTransport,
} = require('../controllers/transport.controller')

// ── Routes ──────────────────────────────────────────────────────────
router.get('/routes',         protect, getAllRoutes)
router.get('/routes/:id',     protect, getRouteById)
router.post('/routes',        protect, authorizeRoles('admin'), createRoute)
router.put('/routes/:id',     protect, authorizeRoles('admin'), updateRoute)
router.delete('/routes/:id',  protect, authorizeRoles('admin'), deleteRoute)

// ── Stops ────────────────────────────────────────────────────────────
router.post('/routes/:route_id/stops',       protect, authorizeRoles('admin'), addStop)
router.delete('/routes/:route_id/stops/:stopId', protect, authorizeRoles('admin'), deleteStop)

// ── Vehicles ─────────────────────────────────────────────────────────
router.get('/vehicles',        protect, getAllVehicles)
router.post('/vehicles',       protect, authorizeRoles('admin'), createVehicle)
router.put('/vehicles/:id',    protect, authorizeRoles('admin'), updateVehicle)
router.delete('/vehicles/:id', protect, authorizeRoles('admin'), deleteVehicle)

// ── Drivers ──────────────────────────────────────────────────────────
router.get('/drivers',        protect, getAllDrivers)
router.post('/drivers',       protect, authorizeRoles('admin'), createDriver)
router.put('/drivers/:id',    protect, authorizeRoles('admin'), updateDriver)
router.delete('/drivers/:id', protect, authorizeRoles('admin'), deleteDriver)

// ── Student Allocation ───────────────────────────────────────────────
router.post('/assign',         protect, authorizeRoles('admin'), assignStudent)
router.delete('/assign/:id',   protect, authorizeRoles('admin'), removeStudentFromRoute)
router.get('/student/:studentId', protect, getStudentTransport)

module.exports = router