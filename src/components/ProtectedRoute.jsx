import { Navigate } from 'react-router-dom'
import { hasSession } from '../services/api.js'

function ProtectedRoute({ children }) {
  return hasSession() ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
