import { Navigate } from 'react-router-dom'
import ProfessionalHomeEntry from './ProfessionalHomeEntry.jsx'
import ProfessionalLayout from './ProfessionalLayout.jsx'
import HomePage from '../pages/Home/Home.jsx'
import { getStoredUser } from '../services/authService.js'

function HomeEntry() {
  const user = getStoredUser()

  if (user?.profile === 'PROFESSIONAL') return <ProfessionalLayout><ProfessionalHomeEntry /></ProfessionalLayout>
  if (user?.profile === 'STUDENT') return <HomePage />
  return <Navigate to="/login" replace />
}

export default HomeEntry
