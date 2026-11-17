import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomeEntry from './components/HomeEntry.jsx'
import LoginPage from './pages/Login/Login.jsx'
import RegisterPage from './pages/Register/Register.jsx'
import LandingPage from './pages/Landing/Landing.jsx'
import ModalidadesPage from './pages/Modalidades/Modalidades.jsx'
import StudentsPage from './pages/Students/Students.jsx'
import StudentProfilePage from './pages/Students/StudentProfile.jsx'
import TrainingProgramEditorPage from './pages/TrainingProgram/TrainingProgramEditor.jsx'
import AtividadesPage from './pages/Atividades/Atividades.jsx'
import NovaAtividadePage from './pages/NovaAtividade/NovaAtividade.jsx'
import ConfigurarAtividadePage from './pages/ConfigurarAtividade/ConfigurarAtividade.jsx'
import BibliotecaPage from './pages/Biblioteca/Biblioteca.jsx'
import ProfessionalProfilePage from './pages/ProfessionalProfile/ProfessionalProfile.jsx'
import StartSession from './pages/Sessions/StartSession.jsx'
import SessionDetails from './pages/Sessions/SessionDetails.jsx'
import SessionActivity from './pages/Sessions/SessionActivity.jsx'
import RegisterExecution from './pages/Sessions/RegisterExecution.jsx'
import CompletedSessions from './pages/Sessions/CompletedSessions.jsx'
import ProfilePage from './pages/Profile/Profile.jsx'
import AcceptInvitePage from './pages/Invites/AcceptInvite.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<ProtectedRoute><HomeEntry /></ProtectedRoute>} />
      <Route path="/modalidades" element={<ProtectedRoute profile="PROFESSIONAL"><ModalidadesPage /></ProtectedRoute>} />
      <Route path="/atividades" element={<ProtectedRoute profile="PROFESSIONAL"><AtividadesPage /></ProtectedRoute>} />
      <Route path="/biblioteca" element={<ProtectedRoute profile="PROFESSIONAL"><BibliotecaPage /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute profile="PROFESSIONAL"><ProfessionalProfilePage /></ProtectedRoute>} />
      <Route path="/atividades/nova" element={<ProtectedRoute profile="PROFESSIONAL"><NovaAtividadePage /></ProtectedRoute>} />
      <Route path="/atividades/:id/configurar" element={<ProtectedRoute profile="PROFESSIONAL"><ConfigurarAtividadePage /></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute profile="PROFESSIONAL"><StudentsPage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId" element={<ProtectedRoute profile="PROFESSIONAL"><StudentProfilePage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId/programas/novo" element={<ProtectedRoute profile="PROFESSIONAL"><TrainingProgramEditorPage /></ProtectedRoute>} />
      <Route path="/alunos/:studentId/programas/:programId/editar" element={<ProtectedRoute profile="PROFESSIONAL"><TrainingProgramEditorPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/invites/accept" element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
      <Route path="/sessions/start" element={<ProtectedRoute><StartSession /></ProtectedRoute>} />
      <Route path="/sessions/completed" element={<ProtectedRoute><CompletedSessions /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/activities/:activityId" element={<ProtectedRoute><SessionActivity /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/executions/:activityId" element={<ProtectedRoute><RegisterExecution /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
