import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ProfessionalHomePage from './pages/ProfessionalHome/ProfessionalHome.jsx'
import LoginPage from './pages/Login/Login.jsx'
import RegisterPage from './pages/Register/Register.jsx'
import LandingPage from './pages/Landing/Landing.jsx'
import StudentsPage, { StudentDetailPage } from './pages/Students/Students.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<ProtectedRoute profile="PROFESSIONAL"><ProfessionalHomePage /></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute profile="PROFESSIONAL"><StudentsPage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId" element={<ProtectedRoute profile="PROFESSIONAL"><StudentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
