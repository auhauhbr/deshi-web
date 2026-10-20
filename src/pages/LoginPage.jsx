import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { login } from '../services/auth.service'

export default function LoginPage() {
  const { session, reason } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)

  if (session) return <Navigate to="/home" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current) return
    if (!email.trim() || !password.trim()) {
      setError('Informe seu e-mail e sua senha.')
      return
    }
    pending.current = true
    setSubmitting(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (failure) {
      setError(failure.message)
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell login-shell">
      <main className="login-panel">
        <h1>Entrar</h1>
        {reason === 'expired' && <p className="notice" role="status">Sua sessão expirou ou é inválida. Entre novamente.</p>}
        <form onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="E-mail" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Senha" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} />
          </div>
          {error && <p className="feedback error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </main>
    </div>
  )
}
