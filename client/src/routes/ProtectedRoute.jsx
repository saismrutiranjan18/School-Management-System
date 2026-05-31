import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

// allowedRoles = ['admin'] or ['admin','teacher'] etc.
const ProtectedRoute = ({ allowedRoles }) => {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute