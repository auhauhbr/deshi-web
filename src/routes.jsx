import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomePage from './pages/Home/Home.jsx'
import LoginPage from './pages/Login/Login.jsx'
import RegisterPage from './pages/Register/Register.jsx'
import LandingPage from './pages/Landing/Landing.jsx'
import StartSession from './pages/Sessions/StartSession.jsx'
import SessionDetails from './pages/Sessions/SessionDetails.jsx'
import RegisterExecution from './pages/Sessions/RegisterExecution.jsx'
import CompletedSessions from './pages/Sessions/CompletedSessions.jsx'
import ProfilePage from './pages/Profile/Profile.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/sessions/start" element={<ProtectedRoute><StartSession /></ProtectedRoute>} />
      <Route path="/sessions/completed" element={<ProtectedRoute><CompletedSessions /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/executions/:activityId" element={<ProtectedRoute><RegisterExecution /></ProtectedRoute>} />
    </Routes>
  )
}

export default AppRoutes
