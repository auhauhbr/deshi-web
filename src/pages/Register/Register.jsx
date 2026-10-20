import { useState } from 'react'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import './Register.css'

function RegisterPage() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: '' })
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (Object.values(form).some((value) => !value.trim())) { setMessage('Preencha todos os campos para criar sua conta.'); return }
    setMessage(!form.email.includes('@') ? 'Informe um endereço de e-mail válido.' : 'A integração com a API de cadastro será adicionada nesta etapa.')
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
      <button className="primary-button" type="submit">Criar conta</button>
    </form>
  </AuthLayout>
}

export default RegisterPage
