import { useState } from 'react'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import './Login.css'

function LoginPage() {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(!form.email || !form.senha ? 'Informe seu e-mail e sua senha para continuar.' : 'A integração com a API de autenticação será adicionada nesta etapa.')
  }

  return <AuthLayout pageClassName="login-page" title="Boas-vindas de volta" subtitle="Entre para acompanhar sua rotina esportiva." footerText="Ainda não possui uma conta?" footerLink="/cadastro" footerLinkText="Crie uma agora">
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={form.email} onChange={updateField} required /></div>
      <PasswordField id="senha" label="Senha" autoComplete="current-password" value={form.senha} onChange={updateField} />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="primary-button" type="submit">Entrar</button>
    </form>
  </AuthLayout>
}

export default LoginPage
