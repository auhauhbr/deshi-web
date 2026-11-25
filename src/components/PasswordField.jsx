import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function PasswordField({ autoComplete, id, label, onChange, value }) {
  const [isVisible, setIsVisible] = useState(false)
  return <div className="field"><label htmlFor={id}>{label}</label><div className="password-input">
    <input id={id} name={id} type={isVisible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={onChange} required />
    <button type="button" className="password-toggle" onClick={() => setIsVisible((visible) => !visible)} aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={isVisible}>{isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
  </div></div>
}

export default PasswordField
