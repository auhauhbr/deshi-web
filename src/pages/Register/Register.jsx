import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import { getApiErrorMessage, registerUser } from '../../services/authService.js'
import './Register.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: '' })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (Object.values(form).some((value) => !value.trim())) { setMessage('Preencha todos os campos para criar sua conta.'); return }
    if (!form.email.includes('@')) { setMessage('Informe um endereço de e-mail válido.'); return }
    if (form.nome.trim().length < 3) { setMessage('O nome deve ter pelo menos 3 caracteres.'); return }
    if (form.senha.length < 8) { setMessage('A senha deve ter pelo menos 8 caracteres.'); return }

    setIsSubmitting(true)
    setMessage('')
    try {
      await registerUser({
        name: form.nome.trim(),
        email: form.email.trim(),
        password: form.senha,
        profile: form.perfil === 'profissional' ? 'PROFESSIONAL' : 'STUDENT',
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Conta criada com sucesso. Agora você já pode entrar.' },
      })
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthLayout pageClassName="register-page" title="Crie sua conta" subtitle="Leva apenas alguns instantes para começar." footerText="Já possui uma conta?" footerLink="/login" footerLinkText="Entrar">
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="field"><label htmlFor="nome">Nome completo</label><input id="nome" name="nome" type="text" autoComplete="name" placeholder="Como você quer ser chamado?" value={form.nome} onChange={updateField} required /></div>
      <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={form.email} onChange={updateField} required /></div>
      <PasswordField id="senha" label="Senha" autoComplete="new-password" value={form.senha} onChange={updateField} />
      <fieldset className="profile-field"><legend>Qual é o seu perfil?</legend><div className="profile-options">
        <label className={`profile-option ${form.perfil === 'profissional' ? 'selected' : ''}`}><input type="radio" name="perfil" value="profissional" checked={form.perfil === 'profissional'} onChange={updateField} /><span>Sou profissional</span><small>Gerencio alunos e treinos</small></label>
        <label className={`profile-option ${form.perfil === 'aluno' ? 'selected' : ''}`}><input type="radio" name="perfil" value="aluno" checked={form.perfil === 'aluno'} onChange={updateField} /><span>Sou aluno</span><small>Acompanho meus treinos</small></label>
      </div></fieldset>
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando conta...' : 'Criar conta'}</button>
    </form>
  </AuthLayout>
}

export default RegisterPage
