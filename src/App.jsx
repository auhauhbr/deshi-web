import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProfessionalRoute from './components/ProfessionalRoute'
import LoginPage from './pages/LoginPage'
import ModalidadesPage from './pages/ModalidadesPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProfessionalRoute />}>
          <Route path="/modalidades" element={<ModalidadesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/modalidades" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
