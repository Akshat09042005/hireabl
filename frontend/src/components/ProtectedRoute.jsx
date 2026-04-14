import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${from}`} replace />
  }

  return children
}

export default ProtectedRoute
