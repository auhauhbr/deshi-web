import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppRoutes from './routes.jsx'
import DatabaseLoadingScreen from './components/DatabaseLoadingScreen.jsx'
import ThemeSwitch from './components/ThemeSwitch.jsx'
import { getStoredUser } from './services/authService.js'
import { resumeApiLoadingScreen } from './services/apiLoadingState.js'
import { applyRouteTheme } from './services/themeService.js'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleSessionExpired = () => navigate('/sessao-expirada', { replace: true })
    window.addEventListener('deshi:session-expired', handleSessionExpired)
    return () => window.removeEventListener('deshi:session-expired', handleSessionExpired)
  }, [navigate])

  useEffect(() => {
    if (location.pathname !== '/home') resumeApiLoadingScreen()
  }, [location.pathname])

  useLayoutEffect(() => {
    applyRouteTheme(location.pathname)
  }, [location.pathname])

  const isPublicLightPage = ['/', '/login', '/cadastro', '/sessao-expirada'].includes(location.pathname)
  const isStudentPage = ['/home', '/profile', '/sessions/start', '/sessions/completed', '/invites/accept'].includes(location.pathname)
    || location.pathname.startsWith('/sessions/')
  const showThemeSwitch = Boolean(getStoredUser()) && !isPublicLightPage && !isStudentPage

  return (
    <>
      <AppRoutes />
      {showThemeSwitch && <ThemeSwitch />}
      <DatabaseLoadingScreen />
    </>
  )
}

export default App
