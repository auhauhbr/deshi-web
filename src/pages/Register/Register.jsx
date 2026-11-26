import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import ParticleButton from '../../components/kokonutui/particle-button.jsx'
import WheelPicker from '../../components/kokonutui/wheel-picker.jsx'
import { getApiErrorMessage, registerUser } from '../../services/authService.js'
import { getLocalDateInputValue } from '../../utils/date.js'
import { formatBirthDate } from '../../utils/userAge.js'
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

const firstBirthYear = 1900
const birthDateFeedbackDuration = 900
const padDatePart = (number) => String(number).padStart(2, '0')
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const birthMonths = Array.from({ length: 12 }, (_, index) => ({
  value: padDatePart(index + 1),
  label: monthFormatter.format(new Date(2000, index, 1)),
}))

function splitBirthDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return { year, month, day }
}

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate()
}

function fitDayToMonth({ year, month, day }) {
  return { year, month, day: padDatePart(Math.min(Number(day), daysInMonth(year, month))) }
}

function BirthDateDialog({ value, triggerRef, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const pickerRef = useRef(null)
  const [today, setToday] = useState(() => getLocalDateInputValue())
  const [selection, setSelection] = useState(() => splitBirthDate(value || today))
  const [confirmedDate, setConfirmedDate] = useState('')
  const selectedDate = `${selection.year}-${selection.month}-${selection.day}`
  const isFutureDate = selectedDate > today
  const columns = [
    { id: 'day', label: 'Dia', className: 'birth-date-wheel__day', options: Array.from({ length: daysInMonth(selection.year, selection.month) }, (_, index) => {
      const day = padDatePart(index + 1)
      return { value: day, label: day }
    }) },
    { id: 'month', label: 'Mês', className: 'birth-date-wheel__month', options: birthMonths },
    { id: 'year', label: 'Ano', className: 'birth-date-wheel__year', options: Array.from({ length: Number(today.slice(0, 4)) - firstBirthYear + 1 }, (_, index) => {
      const year = String(firstBirthYear + index)
      return { value: year, label: year }
    }) },
  ]

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const trigger = triggerRef.current
    dialog.showModal()
    dialog.querySelector('[role="spinbutton"]')?.focus()
    return () => {
      dialog.close()
      trigger?.focus({ preventScroll: true })
    }
  }, [triggerRef])

  useEffect(() => {
    if (!confirmedDate) return undefined
    const timer = window.setTimeout(() => onConfirm(confirmedDate), birthDateFeedbackDuration)
    return () => window.clearTimeout(timer)
  }, [confirmedDate, onConfirm])

  function confirmDate() {
    const next = fitDayToMonth(pickerRef.current.getSelection())
    const date = `${next.year}-${next.month}-${next.day}`
    const currentToday = getLocalDateInputValue()
    if (date > currentToday) {
      setToday(currentToday)
      setSelection(next)
      return
    }
    setSelection(next)
    setConfirmedDate(date)
  }

  return <dialog
    ref={dialogRef}
    id="register-birth-date-dialog"
    className="register-dialog register-birth-date-dialog"
    aria-labelledby="register-birth-date-title"
    onCancel={(event) => { event.preventDefault(); onCancel() }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) onCancel()
    }}
  >
    <header className="register-dialog__header">
      <div><p className="register-dialog__eyebrow">SEU PERFIL</p><h2 id="register-birth-date-title">Data de nascimento</h2></div>
      <button className="register-dialog__close" type="button" onClick={onCancel} aria-label="Fechar seleção de data"><X size={19} aria-hidden="true" /></button>
    </header>
    <div className="birth-date-wheel__labels" aria-hidden="true"><span>Dia</span><span>Mês</span><span>Ano</span></div>
    <div inert={Boolean(confirmedDate)}>
      <WheelPicker
        ref={pickerRef}
        className="birth-date-wheel"
        columns={columns}
        value={selection}
        onValueChange={(next) => {
          if (!confirmedDate) setSelection(fitDayToMonth(next))
        }}
        label="Dia, mês e ano de nascimento"
      />
    </div>
    <output className="birth-date-selection" aria-label="Data selecionada">{formatBirthDate(selectedDate)}</output>
    <p id="birth-date-error" className="birth-date-error" role="status">{isFutureDate ? 'A data de nascimento não pode estar no futuro. Selecione hoje ou uma data anterior.' : ''}</p>
    <div className="birth-date-actions">
      <button type="button" onClick={onCancel}>Cancelar</button>
      <ParticleButton
        className="auth-submit"
        fullWidth
        status={confirmedDate ? 'success' : 'idle'}
        successLabel={<span>Data confirmada!</span>}
        disabled={isFutureDate || Boolean(confirmedDate)}
        aria-describedby={isFutureDate ? 'birth-date-error' : undefined}
        onClick={confirmDate}
      >
        Confirmar
      </ParticleButton>
    </div>
  </dialog>
}

function RegisterPage() {
  const navigate = useNavigate()
  const birthDateTriggerRef = useRef(null)
  const [form, setForm] = useState({ nome: '', dataNascimento: '', genero: '', email: '', senha: '', confirmarSenha: '', perfil: '' })
  const [step, setStep] = useState('profile')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBirthDateOpen, setIsBirthDateOpen] = useState(false)
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  const passwordStrength = getPasswordStrength(form.senha)
  const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte']
  const isChoiceDialogOpen = isBirthDateOpen || isGenderOpen

  useEffect(() => {
    if (!isChoiceDialogOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
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

  function selectBirthDate(date) {
    setForm((currentForm) => ({ ...currentForm, dataNascimento: date }))
    setMessage('')
    setIsBirthDateOpen(false)
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
          <div className="field">
            <RequiredLabel htmlFor="dataNascimento">Data de nascimento</RequiredLabel>
            <button
              ref={birthDateTriggerRef}
              className="register-picker-trigger"
              id="dataNascimento"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isBirthDateOpen}
              aria-controls={isBirthDateOpen ? 'register-birth-date-dialog' : undefined}
              aria-describedby="register-birth-date-value"
              onClick={() => setIsBirthDateOpen(true)}
            >
              <span id="register-birth-date-value" className={form.dataNascimento ? '' : 'is-placeholder'}>
                {form.dataNascimento ? formatBirthDate(form.dataNascimento) : 'Selecione sua data de nascimento'}
              </span>
              <CalendarDays size={19} aria-hidden="true" />
            </button>
          </div>
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
    {isBirthDateOpen && <BirthDateDialog
      value={form.dataNascimento}
      triggerRef={birthDateTriggerRef}
      onCancel={() => setIsBirthDateOpen(false)}
      onConfirm={selectBirthDate}
    />}
    {isGenderOpen && <div className="register-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsGenderOpen(false) }}>
      <section className="register-dialog register-gender-dialog" role="dialog" aria-modal="true" aria-labelledby="register-gender-title">
        <header className="register-dialog__header"><div><p className="register-dialog__eyebrow">SEU PERFIL</p><h2 id="register-gender-title">Selecione seu gênero</h2></div><button className="register-dialog__close" type="button" onClick={() => setIsGenderOpen(false)} aria-label="Fechar seleção de gênero"><X size={19} /></button></header>
        <div className="register-gender-options"><button type="button" aria-pressed={form.genero === 'MALE'} onClick={() => selectGender('MALE')}><span>Masculino</span>{form.genero === 'MALE' && <Check size={19} aria-hidden="true" />}</button><button type="button" aria-pressed={form.genero === 'FEMALE'} onClick={() => selectGender('FEMALE')}><span>Feminino</span>{form.genero === 'FEMALE' && <Check size={19} aria-hidden="true" />}</button></div>
      </section>
    </div>}
  </AuthLayout>
}

export default RegisterPage
