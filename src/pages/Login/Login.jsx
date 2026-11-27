import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import SwipeToast from '../../components/SwipeToast.jsx'
import { getApiErrorMessage, loginUser } from '../../services/authService.js'
import { suppressApiLoadingScreen } from '../../services/apiLoadingState.js'
import './Login.css'

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [message, setMessage] = useState(location.state?.message || '')
  const [successToast, setSuccessToast] = useState(() => (
    location.state?.registrationSuccess ? 'registration' : location.state?.logoutSuccess ? 'logout' : ''
  ))
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
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        suppressApiLoadingScreen()
      }
      navigate('/home', {
        replace: true,
        state: { profile: user.profile, playLoginReveal: true },
      })
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return <>
  <AuthLayout
    pageClassName="login-page"
    title="Entrar na sua conta"
    subtitle="Acesse seus treinos e acompanhamentos."
    introTitle="Seu espaço de treino está aqui."
    introDescription="Encontre programas, registros e o que precisa para seguir sua rotina esportiva."
    introFooter="Deshi — gestão esportiva individual."
    footerText="Ainda não possui uma conta?"
    footerLink="/cadastro"
    footerLinkText="Criar conta"
  >
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={form.email} onChange={updateField} required /></div>
      <PasswordField id="senha" label="Senha" autoComplete="current-password" value={form.senha} onChange={updateField} />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </AuthLayout>
  <SwipeToast
    open={Boolean(successToast)}
    title={successToast === 'logout' ? 'Você saiu da conta com sucesso!' : 'Conta criada com sucesso!'}
    description={successToast === 'logout' ? 'Sua sessão foi encerrada com segurança.' : 'Agora você já pode entrar na sua conta.'}
    onClose={() => {
      setSuccessToast('')
      navigate('/login', { replace: true, state: null })
    }}
  />
  </>
}

export default LoginPage
