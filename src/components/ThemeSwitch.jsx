import { useState } from 'react'
import { getTheme, setTheme } from '../services/themeService.js'
import SwitchButton from './kokonutui/switch-button.jsx'
import './ThemeSwitch.css'

function ThemeSwitch() {
  const [theme, setThemeState] = useState(getTheme)

  return (
    <div className="theme-switch-anchor">
      <SwitchButton checked={theme === 'dark'} onCheckedChange={(checked) => setThemeState(setTheme(checked ? 'dark' : 'light'))} />
    </div>
  )
}

export default ThemeSwitch
