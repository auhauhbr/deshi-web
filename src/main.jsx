import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/variables.css'
import './index.css'
import App from './App.jsx'
import { applyRouteTheme } from './services/themeService.js'

applyRouteTheme(window.location.pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
