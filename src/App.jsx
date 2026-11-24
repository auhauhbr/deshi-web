import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppRoutes from './routes.jsx'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleSessionExpired = () => navigate('/sessao-expirada', { replace: true })
    window.addEventListener('deshi:session-expired', handleSessionExpired)
    return () => window.removeEventListener('deshi:session-expired', handleSessionExpired)
  }, [navigate])

  return (
    <AppRoutes />
  )
}

export default App
