import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ProfessionalHomeEntry from './components/ProfessionalHomeEntry.jsx'
import LoginPage from './pages/Login/Login.jsx'
import RegisterPage from './pages/Register/Register.jsx'
import LandingPage from './pages/Landing/Landing.jsx'
import ModalidadesPage from './pages/Modalidades/Modalidades.jsx'
import StudentsPage from './pages/Students/Students.jsx'
import StudentProfilePage from './pages/Students/StudentProfile.jsx'
import TrainingProgramEditorPage from './pages/TrainingProgram/TrainingProgramEditor.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<ProtectedRoute profile="PROFESSIONAL"><ProfessionalHomeEntry /></ProtectedRoute>} />
      <Route path="/modalidades" element={<ProtectedRoute profile="PROFESSIONAL"><ModalidadesPage /></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute profile="PROFESSIONAL"><StudentsPage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId" element={<ProtectedRoute profile="PROFESSIONAL"><StudentProfilePage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId/programas/novo" element={<ProtectedRoute profile="PROFESSIONAL"><TrainingProgramEditorPage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId/programas/:programId/editar" element={<ProtectedRoute profile="PROFESSIONAL"><TrainingProgramEditorPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
