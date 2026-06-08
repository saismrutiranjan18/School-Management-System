const pool = require('../config/db')

// ── ROUTES ────────────────────────────────────────────────────────────

const getAllRoutes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.*,
        COUNT(DISTINCT st.student_id) AS student_count,
        v.vehicle_no,
        v.vehicle_type,
        v.capacity,
        d.name AS driver_name,
        d.phone AS driver_phone
      FROM transport_routes r
      LEFT JOIN student_transport st ON st.route_id = r.id
      LEFT JOIN vehicles v           ON v.route_id  = r.id
      LEFT JOIN drivers  d           ON d.vehicle_id = v.id
      GROUP BY r.id, v.vehicle_no, v.vehicle_type, v.capacity, d.name, d.phone
      ORDER BY r.name
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch routes.' })
  }
}

const getRouteById = async (req, res) => {
  try {
    const route = await pool.query(
      'SELECT * FROM transport_routes WHERE id=$1',
      [req.params.id]
    )
    if (!route.rows[0])
      return res.status(404).json({ error: 'Route not found.' })

    const stops = await pool.query(
      'SELECT * FROM route_stops WHERE route_id=$1 ORDER BY stop_order',
      [req.params.id]
    )

    const students = await pool.query(`
      SELECT
        st.id AS allocation_id,
        s.id  AS student_id,
        u.name,
        s.roll_no,
        c.name AS class_name,
        c.section,
        rs.stop_name,
        rs.pickup_time
      FROM student_transport st
      JOIN students s   ON st.student_id = s.id
      JOIN users u      ON s.user_id     = u.id
      JOIN classes c    ON s.class_id    = c.id
      LEFT JOIN route_stops rs ON st.stop_id = rs.id
      WHERE st.route_id = $1
      ORDER BY u.name
    `, [req.params.id])

    res.json({
      route:    route.rows[0],
      stops:    stops.rows,
      students: students.rows,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch route details.' })
  }
}

const createRoute = async (req, res) => {
  const { name, description, start_point, end_point, distance_km, stops } = req.body

  if (!name)
    return res.status(400).json({ error: 'Route name is required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const routeResult = await client.query(`
      INSERT INTO transport_routes
        (name, description, start_point, end_point, distance_km)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, description || null, start_point || null, end_point || null, distance_km || null])

    const route = routeResult.rows[0]

    // Insert stops if provided
    if (stops && stops.length > 0) {
      for (const stop of stops) {
        await client.query(`
          INSERT INTO route_stops
            (route_id, stop_name, stop_order, pickup_time, drop_time, landmark)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [
          route.id,
          stop.stop_name,
          stop.stop_order,
          stop.pickup_time || null,
          stop.drop_time   || null,
          stop.landmark    || null,
        ])
      }
    }

    await client.query('COMMIT')
    res.status(201).json(route)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to create route.' })
  } finally {
    client.release()
  }
}

const updateRoute = async (req, res) => {
  const { name, description, start_point, end_point, distance_km, is_active } = req.body
  try {
    const result = await pool.query(`
      UPDATE transport_routes
      SET name=$1, description=$2, start_point=$3,
          end_point=$4, distance_km=$5, is_active=$6
      WHERE id=$7 RETURNING *
    `, [name, description || null, start_point || null,
        end_point || null, distance_km || null,
        is_active ?? true, req.params.id])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Route not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update route.' })
  }
}

const deleteRoute = async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT COUNT(*) FROM student_transport WHERE route_id=$1',
      [req.params.id]
    )
    if (parseInt(check.rows[0].count) > 0)
      return res.status(400).json({
        error: 'Cannot delete route with assigned students.',
      })

    await pool.query('DELETE FROM transport_routes WHERE id=$1', [req.params.id])
    res.json({ message: 'Route deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete route.' })
  }
}

// ── STOPS ─────────────────────────────────────────────────────────────

const addStop = async (req, res) => {
  const { route_id } = req.params
  const { stop_name, stop_order, pickup_time, drop_time, landmark } = req.body

  if (!stop_name || !stop_order)
    return res.status(400).json({ error: 'stop_name and stop_order are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO route_stops
        (route_id, stop_name, stop_order, pickup_time, drop_time, landmark)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [route_id, stop_name, stop_order, pickup_time || null, drop_time || null, landmark || null])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Stop order already exists for this route.' })
    res.status(500).json({ error: 'Failed to add stop.' })
  }
}

const deleteStop = async (req, res) => {
  try {
    await pool.query('DELETE FROM route_stops WHERE id=$1', [req.params.stopId])
    res.json({ message: 'Stop deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete stop.' })
  }
}

// ── VEHICLES ──────────────────────────────────────────────────────────

const getAllVehicles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.*,
        r.name AS route_name,
        d.name AS driver_name,
        d.phone AS driver_phone
      FROM vehicles v
      LEFT JOIN transport_routes r ON v.route_id  = r.id
      LEFT JOIN drivers          d ON d.vehicle_id = v.id
      ORDER BY v.vehicle_no
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles.' })
  }
}

const createVehicle = async (req, res) => {
  const {
    vehicle_no, vehicle_type, capacity,
    model, route_id, insurance_expiry, fitness_expiry,
  } = req.body

  if (!vehicle_no || !capacity)
    return res.status(400).json({ error: 'vehicle_no and capacity are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO vehicles
        (vehicle_no, vehicle_type, capacity, model,
         route_id, insurance_expiry, fitness_expiry)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [
      vehicle_no.toUpperCase(),
      vehicle_type      || 'Bus',
      capacity,
      model             || null,
      route_id          || null,
      insurance_expiry  || null,
      fitness_expiry    || null,
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Vehicle number already exists.' })
    res.status(500).json({ error: 'Failed to create vehicle.' })
  }
}

const updateVehicle = async (req, res) => {
  const {
    vehicle_no, vehicle_type, capacity, model,
    route_id, insurance_expiry, fitness_expiry, is_active,
  } = req.body
  try {
    const result = await pool.query(`
      UPDATE vehicles
      SET vehicle_no=$1, vehicle_type=$2, capacity=$3, model=$4,
          route_id=$5, insurance_expiry=$6, fitness_expiry=$7, is_active=$8
      WHERE id=$9 RETURNING *
    `, [
      vehicle_no.toUpperCase(), vehicle_type || 'Bus', capacity,
      model || null, route_id || null,
      insurance_expiry || null, fitness_expiry || null,
      is_active ?? true, req.params.id,
    ])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Vehicle not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vehicle.' })
  }
}

const deleteVehicle = async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id=$1', [req.params.id])
    res.json({ message: 'Vehicle deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle.' })
  }
}

// ── DRIVERS ───────────────────────────────────────────────────────────

const getAllDrivers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.*,
        v.vehicle_no,
        v.vehicle_type,
        r.name AS route_name
      FROM drivers d
      LEFT JOIN vehicles         v ON d.vehicle_id = v.id
      LEFT JOIN transport_routes r ON v.route_id   = r.id
      ORDER BY d.name
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers.' })
  }
}

const createDriver = async (req, res) => {
  const { name, phone, license_no, license_expiry, address, vehicle_id } = req.body

  if (!name || !phone || !license_no)
    return res.status(400).json({ error: 'name, phone and license_no are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO drivers
        (name, phone, license_no, license_expiry, address, vehicle_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [name, phone, license_no, license_expiry || null, address || null, vehicle_id || null])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'License number already exists.' })
    res.status(500).json({ error: 'Failed to create driver.' })
  }
}

const updateDriver = async (req, res) => {
  const { name, phone, license_no, license_expiry, address, vehicle_id, is_active } = req.body
  try {
    const result = await pool.query(`
      UPDATE drivers
      SET name=$1, phone=$2, license_no=$3, license_expiry=$4,
          address=$5, vehicle_id=$6, is_active=$7
      WHERE id=$8 RETURNING *
    `, [
      name, phone, license_no, license_expiry || null,
      address || null, vehicle_id || null,
      is_active ?? true, req.params.id,
    ])

    if (!result.rows[0])
      return res.status(404).json({ error: 'Driver not found.' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update driver.' })
  }
}

const deleteDriver = async (req, res) => {
  try {
    await pool.query('DELETE FROM drivers WHERE id=$1', [req.params.id])
    res.json({ message: 'Driver deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete driver.' })
  }
}

// ── STUDENT ALLOCATION ────────────────────────────────────────────────

const assignStudent = async (req, res) => {
  const { student_id, route_id, stop_id, academic_year } = req.body

  if (!student_id || !route_id)
    return res.status(400).json({ error: 'student_id and route_id are required.' })

  try {
    const result = await pool.query(`
      INSERT INTO student_transport
        (student_id, route_id, stop_id, academic_year)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (student_id, academic_year)
      DO UPDATE SET
        route_id = EXCLUDED.route_id,
        stop_id  = EXCLUDED.stop_id
      RETURNING *
    `, [student_id, route_id, stop_id || null, academic_year || '2024-25'])

    res.status(201).json({
      message: 'Student assigned to route.',
      allocation: result.rows[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to assign student.' })
  }
}

const removeStudentFromRoute = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM student_transport WHERE id=$1',
      [req.params.id]
    )
    res.json({ message: 'Student removed from route.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove student.' })
  }
}

const getStudentTransport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        st.*,
        r.name        AS route_name,
        r.start_point,
        r.end_point,
        rs.stop_name,
        rs.pickup_time,
        rs.drop_time,
        rs.landmark,
        v.vehicle_no,
        v.vehicle_type,
        v.capacity,
        d.name        AS driver_name,
        d.phone       AS driver_phone,
        d.license_no  AS driver_license
      FROM student_transport st
      JOIN transport_routes r  ON st.route_id   = r.id
      LEFT JOIN route_stops rs ON st.stop_id    = rs.id
      LEFT JOIN vehicles    v  ON v.route_id    = r.id
      LEFT JOIN drivers     d  ON d.vehicle_id  = v.id
      WHERE st.student_id = $1
      ORDER BY st.created_at DESC
    `, [req.params.studentId])

    res.json(result.rows[0] || null)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transport details.' })
  }
}

module.exports = {
  getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute,
  addStop, deleteStop,
  getAllVehicles, createVehicle, updateVehicle, deleteVehicle,
  getAllDrivers, createDriver, updateDriver, deleteDriver,
  assignStudent, removeStudentFromRoute, getStudentTransport,
}