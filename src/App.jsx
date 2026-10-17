import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProfessionalRoute from './components/ProfessionalRoute'
import LoginPage from './pages/LoginPage'
import ModalidadesPage from './pages/ModalidadesPage'
import AtividadesPage from './pages/AtividadesPage'
import NovaAtividadePage from './pages/NovaAtividadePage'
import ConfigurarAtividadePage from './pages/ConfigurarAtividadePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProfessionalRoute />}>
          <Route path="/modalidades" element={<ModalidadesPage />} />
          <Route path="/atividades" element={<AtividadesPage />} />
          <Route path="/atividades/nova" element={<NovaAtividadePage />} />
          <Route path="/atividades/:id/configurar" element={<ConfigurarAtividadePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/modalidades" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
