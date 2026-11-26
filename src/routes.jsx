import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomeEntry from './components/HomeEntry.jsx'
import ProfessionalLayout from './components/ProfessionalLayout.jsx'
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
import ProfessionalSessionDetails from './pages/ProfessionalSessionDetails/ProfessionalSessionDetails.jsx'
import ActivityDetailPage from './pages/Biblioteca/ActivityDetail.jsx'
import StartSession from './pages/Sessions/StartSession.jsx'
import SessionDetails from './pages/Sessions/SessionDetails.jsx'
import SessionActivity from './pages/Sessions/SessionActivity.jsx'
import RegisterExecution from './pages/Sessions/RegisterExecution.jsx'
import CompletedSessions from './pages/Sessions/CompletedSessions.jsx'
import ProfilePage from './pages/Profile/Profile.jsx'
import AcceptInvitePage from './pages/Invites/AcceptInvite.jsx'
import SessionExpiredPage from './pages/SessionExpired/SessionExpired.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sessao-expirada" element={<SessionExpiredPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<ProtectedRoute><HomeEntry /></ProtectedRoute>} />
      <Route element={<ProtectedRoute profile="PROFESSIONAL"><ProfessionalLayout /></ProtectedRoute>}>
        <Route path="/modalidades" element={<ModalidadesPage />} />
        <Route path="/atividades" element={<AtividadesPage />} />
        <Route path="/biblioteca" element={<BibliotecaPage />} />
        <Route path="/biblioteca/atividades/:id" element={<ActivityDetailPage />} />
        <Route path="/perfil" element={<ProfessionalProfilePage />} />
        <Route path="/atividades/nova" element={<NovaAtividadePage />} />
        <Route path="/atividades/:id/editar" element={<NovaAtividadePage />} />
        <Route path="/atividades/:id/configurar" element={<ConfigurarAtividadePage />} />
        <Route path="/alunos" element={<StudentsPage />} />
        <Route path="/alunos/:studentId" element={<StudentProfilePage />} />
        <Route path="/alunos/:studentId/programas/novo" element={<TrainingProgramEditorPage />} />
        <Route path="/alunos/:studentId/programas/:programId/editar" element={<TrainingProgramEditorPage />} />
        <Route path="/professional/sessions/:sessionId" element={<ProfessionalSessionDetails />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/invites/accept" element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
      <Route path="/sessions/start" element={<ProtectedRoute><StartSession /></ProtectedRoute>} />
      <Route path="/sessions/completed" element={<ProtectedRoute><CompletedSessions /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/activities/:activityId" element={<ProtectedRoute><SessionActivity /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
      <Route path="/sessions/preview/:programId" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId/executions/:activityId" element={<ProtectedRoute><RegisterExecution /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
