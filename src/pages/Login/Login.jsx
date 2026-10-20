import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import { getApiErrorMessage, loginUser } from '../../services/authService.js'
import './Login.css'

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [message, setMessage] = useState(location.state?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.email || !form.senha) {
      setMessage('Informe seu e-mail e sua senha para continuar.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      const user = await loginUser({ email: form.email, password: form.senha })
      navigate('/home', { replace: true, state: { profile: user.profile } })
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthLayout pageClassName="login-page" title="Boas-vindas de volta" subtitle="Entre para acompanhar sua rotina esportiva." footerText="Ainda não possui uma conta?" footerLink="/cadastro" footerLinkText="Crie uma agora">
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={form.email} onChange={updateField} required /></div>
      <PasswordField id="senha" label="Senha" autoComplete="current-password" value={form.senha} onChange={updateField} />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </AuthLayout>
}

export default LoginPage
