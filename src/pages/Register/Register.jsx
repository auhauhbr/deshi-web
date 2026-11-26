import { useEffect, useState } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import { getApiErrorMessage, registerUser } from '../../services/authService.js'
import { getLocalDateInputValue } from '../../utils/date.js'
import './Register.css'

function RequiredLabel({ htmlFor, children }) {
  return <label htmlFor={htmlFor}>{children} <span className="required-asterisk" aria-hidden="true">*</span><span className="visually-hidden"> obrigatório</span></label>
}

function getPasswordStrength(password) {
  if (!password) return 0
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  return Math.max(1, score)
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateForPicker(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function getCalendarDays(monthDate) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - mondayOffset)
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', dataNascimento: '', genero: '', email: '', senha: '', confirmarSenha: '', perfil: '' })
  const [step, setStep] = useState('profile')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const passwordStrength = getPasswordStrength(form.senha)
  const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte']
  const isChoiceDialogOpen = isCalendarOpen || isGenderOpen
  const calendarDays = getCalendarDays(calendarMonth)
  const todayValue = getLocalDateInputValue()
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(calendarMonth)

  useEffect(() => {
    if (!isChoiceDialogOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false)
        setIsGenderOpen(false)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isChoiceDialogOpen])

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function openCalendar() {
    const selectedDate = form.dataNascimento ? new Date(`${form.dataNascimento}T12:00:00`) : new Date()
    setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    setIsCalendarOpen(true)
  }

  function selectBirthDate(date) {
    setForm((currentForm) => ({ ...currentForm, dataNascimento: toDateInputValue(date) }))
    setMessage('')
    setIsCalendarOpen(false)
  }

  function selectGender(gender) {
    setForm((currentForm) => ({ ...currentForm, genero: gender }))
    setMessage('')
    setIsGenderOpen(false)
  }

  function handlePersonalNext(event) {
    event.preventDefault()
    if (!form.nome.trim() || !form.dataNascimento || !form.genero) {
      setMessage('Preencha todos os campos obrigatórios para continuar.')
      return
    }
    if (form.nome.trim().length < 3) {
      setMessage('O nome completo deve ter pelo menos 3 caracteres.')
      return
    }
    if (form.dataNascimento > getLocalDateInputValue()) {
      setMessage('A data de nascimento não pode estar no futuro.')
      return
    }
    setMessage('')
    setStep('credentials')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.email.trim() || !form.senha || !form.confirmarSenha) {
      setMessage('Preencha todos os campos obrigatórios para criar sua conta.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage('Informe um endereço de e-mail válido.')
      return
    }
    if (form.senha.length < 8) {
      setMessage('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      setMessage('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      await registerUser({
        name: form.nome.trim(),
        email: form.email.trim(),
        password: form.senha,
        profile: form.perfil === 'profissional' ? 'PROFESSIONAL' : 'STUDENT',
        birthDate: form.dataNascimento,
        gender: form.genero,
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

  const profileName = form.perfil === 'profissional' ? 'Profissional' : 'Aluno'

  return <AuthLayout
    pageClassName="register-page"
    title={step === 'profile' ? 'Escolha seu perfil' : step === 'personal' ? 'Seus dados pessoais' : `Criar uma conta de ${profileName}`}
    subtitle={step === 'profile' ? 'Selecione como você vai usar o Deshi.' : step === 'personal' ? 'Etapa 1 de 2 · Informe seus dados pessoais.' : 'Etapa 2 de 2 · Informe seus dados de acesso.'}
    introTitle="Uma rotina melhor, aluno por aluno."
    introDescription="Crie seu acesso para organizar treinos ou acompanhar os programas que recebeu."
    introFooter="Para profissionais independentes e seus alunos."
    footerText="Já possui uma conta?"
    footerLink="/login"
    footerLinkText="Entrar"
  >
    {step === 'profile' ? (
      <section className="register-profile-step" aria-label="Escolha seu perfil">
        <div className="register-profile-cards">
          <button className="register-profile-card" type="button" onClick={() => { setForm((current) => ({ ...current, perfil: 'profissional' })); setStep('personal') }}>
            <span className="register-profile-card__art is-professional" aria-hidden="true" />
            <span className="register-profile-card__copy"><small>QUERO SER</small><strong>Profissional</strong></span>
          </button>
          <button className="register-profile-card" type="button" onClick={() => { setForm((current) => ({ ...current, perfil: 'aluno' })); setStep('personal') }}>
            <span className="register-profile-card__art is-student" aria-hidden="true" />
            <span className="register-profile-card__copy"><small>QUERO SER</small><strong>Aluno</strong></span>
          </button>
        </div>
      </section>
    ) : step === 'personal' ? (
      <>
        <button className="register-back" type="button" onClick={() => { setStep('profile'); setMessage('') }}>← <span>Trocar perfil</span></button>
        <form className="auth-form" onSubmit={handlePersonalNext} noValidate>
          <div className="field"><RequiredLabel htmlFor="nome">Nome completo</RequiredLabel><input id="nome" name="nome" type="text" autoComplete="name" placeholder="Como você quer ser chamado?" value={form.nome} onChange={updateField} required /></div>
          <div className="field"><RequiredLabel htmlFor="dataNascimento">Data de nascimento</RequiredLabel><button className="register-picker-trigger" id="dataNascimento" type="button" aria-haspopup="dialog" aria-expanded={isCalendarOpen} onClick={openCalendar}><span className={form.dataNascimento ? '' : 'is-placeholder'}>{form.dataNascimento ? formatDateForPicker(form.dataNascimento) : 'Selecione sua data de nascimento'}</span><CalendarDays size={19} aria-hidden="true" /></button></div>
          <div className="field"><RequiredLabel htmlFor="genero">Gênero</RequiredLabel><button className="register-picker-trigger" id="genero" type="button" aria-haspopup="dialog" aria-expanded={isGenderOpen} onClick={() => setIsGenderOpen(true)}><span className={form.genero ? '' : 'is-placeholder'}>{form.genero === 'MALE' ? 'Masculino' : form.genero === 'FEMALE' ? 'Feminino' : 'Selecione seu gênero'}</span><ChevronDown size={19} aria-hidden="true" /></button></div>
          {message && <p className="form-message" role="alert">{message}</p>}
          <button className="auth-submit" type="submit">Próximo</button>
        </form>
      </>
    ) : (
      <>
        <button className="register-back" type="button" onClick={() => { setStep('personal'); setMessage('') }}>← <span>Voltar aos dados pessoais</span></button>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field"><RequiredLabel htmlFor="email">E-mail</RequiredLabel><input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={form.email} onChange={updateField} required /></div>
          <PasswordField id="senha" label="Senha" autoComplete="new-password" value={form.senha} onChange={updateField} requiredIndicator />
          {form.senha && <div className={`password-strength password-strength--${passwordStrength}`}>
            <div className="password-strength__meter" role="meter" aria-label="Força da senha" aria-valuemin="1" aria-valuemax="4" aria-valuenow={passwordStrength} aria-valuetext={strengthLabels[passwordStrength]}>
              {[1, 2, 3, 4].map((level) => <span className={level <= passwordStrength ? 'is-active' : ''} key={level} />)}
            </div>
            <span aria-live="polite">Força da senha: {strengthLabels[passwordStrength]}</span>
          </div>}
          <PasswordField id="confirmarSenha" label="Confirmar senha" autoComplete="new-password" value={form.confirmarSenha} onChange={updateField} requiredIndicator />
          {message && <p className="form-message" role="alert">{message}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando conta...' : 'Criar conta'}</button>
        </form>
      </>
    )}
    {isCalendarOpen && <div className="register-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCalendarOpen(false) }}>
      <section className="register-dialog register-calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="register-calendar-title">
        <header className="register-dialog__header"><div><p className="register-dialog__eyebrow">SEU PERFIL</p><h2 id="register-calendar-title">Data de nascimento</h2></div><button className="register-dialog__close" type="button" onClick={() => setIsCalendarOpen(false)} aria-label="Fechar calendário"><X size={19} /></button></header>
        <div className="register-calendar__navigation"><button type="button" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={19} /></button><strong>{monthLabel}</strong><label className="register-calendar__year">Ano<input type="number" min="1900" max={new Date().getFullYear()} value={calendarMonth.getFullYear()} aria-label="Ano do nascimento" onChange={(event) => { const year = Number(event.target.value); if (year >= 1900 && year <= new Date().getFullYear()) setCalendarMonth((month) => new Date(year, month.getMonth(), 1)) }} /></label><button type="button" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} disabled={toDateInputValue(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)) > todayValue} aria-label="Próximo mês"><ChevronRight size={19} /></button></div>
        <div className="register-calendar__weekdays" aria-hidden="true">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="register-calendar__grid">{calendarDays.map((date) => {
          const dateValue = toDateInputValue(date)
          const isCurrentMonth = date.getMonth() === calendarMonth.getMonth()
          const isSelected = dateValue === form.dataNascimento
          const isFuture = dateValue > todayValue
          return <button className={`${isCurrentMonth ? '' : 'is-outside-month'} ${isSelected ? 'is-selected' : ''}`} type="button" key={dateValue} disabled={isFuture} aria-pressed={isSelected} aria-label={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date)} onClick={() => selectBirthDate(date)}>{date.getDate()}</button>
        })}</div>
        <p className="register-calendar__hint">Selecione o dia, mês e ano em que você nasceu.</p>
      </section>
    </div>}
    {isGenderOpen && <div className="register-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsGenderOpen(false) }}>
      <section className="register-dialog register-gender-dialog" role="dialog" aria-modal="true" aria-labelledby="register-gender-title">
        <header className="register-dialog__header"><div><p className="register-dialog__eyebrow">SEU PERFIL</p><h2 id="register-gender-title">Selecione seu gênero</h2></div><button className="register-dialog__close" type="button" onClick={() => setIsGenderOpen(false)} aria-label="Fechar seleção de gênero"><X size={19} /></button></header>
        <div className="register-gender-options"><button type="button" aria-pressed={form.genero === 'MALE'} onClick={() => selectGender('MALE')}><span>Masculino</span>{form.genero === 'MALE' && <Check size={19} aria-hidden="true" />}</button><button type="button" aria-pressed={form.genero === 'FEMALE'} onClick={() => selectGender('FEMALE')}><span>Feminino</span>{form.genero === 'FEMALE' && <Check size={19} aria-hidden="true" />}</button></div>
      </section>
    </div>}
  </AuthLayout>
}

export default RegisterPage
