import { Navigate } from 'react-router-dom'
import { hasSession } from '../services/api.js'

function ProtectedRoute({ children, profile }) {
  if (!hasSession()) return <Navigate to="/login" replace />
  if (profile && JSON.parse(localStorage.getItem('deshi.user') || '{}').profile !== profile) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
