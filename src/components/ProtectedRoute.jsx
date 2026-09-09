import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, needsStoreSelection } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (needsStoreSelection && location.pathname !== '/select-store') {
    return <Navigate to="/select-store" replace />
  }
  return children || <Outlet />
}

export function RoleRoute({ allow, children }) {
  const { role } = useAuth()
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return children
}
