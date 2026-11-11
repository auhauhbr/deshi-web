import { useState } from 'react'

function PasswordField({ autoComplete, id, label, onChange, value }) {
  const [isVisible, setIsVisible] = useState(false)
  return <div className="field"><label htmlFor={id}>{label}</label><div className="password-input">
    <input id={id} name={id} type={isVisible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={onChange} required />
    <button type="button" className="password-toggle" onClick={() => setIsVisible((visible) => !visible)} aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}>{isVisible ? 'Ocultar' : 'Mostrar'}</button>
  </div></div>
}

export default PasswordField
