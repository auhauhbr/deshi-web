import { useEffect, useState } from 'react'
import BrandLogo from '../../components/BrandLogo.jsx'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import { getApiErrorMessage, getStoredUser } from '../../services/authService.js'
import { api } from '../../services/api.js'
import '../Sessions/StartSession.css'
import '../Home/Home.css'
import './AcceptInvite.css'

const CODE_CHARACTERS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/
const ACCEPTED_TICKET_STORAGE_PREFIX = 'deshi.accepted-ticket.'

function getAcceptedTicket(studentId) {
  if (!studentId) return null
  try {
    return JSON.parse(localStorage.getItem(`${ACCEPTED_TICKET_STORAGE_PREFIX}${studentId}`) || 'null')
  } catch {
    return null
  }
}

function AcceptInvitePage() {
  const student = getStoredUser()
  const [code, setCode] = useState('')
  const [invite, setInvite] = useState(null)
  const [acceptedInvite, setAcceptedInvite] = useState(null)
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [linksError, setLinksError] = useState('')
  const [linksAttempt, setLinksAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCuttingTicket, setIsCuttingTicket] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [isAddingProfessional, setIsAddingProfessional] = useState(false)

  useEffect(() => {
    if (student?.profile !== 'STUDENT') {
      setIsLoadingLinks(false)
      return undefined
    }

    let isCurrent = true
    setIsLoadingLinks(true)
    setLinksError('')

    api.get('/vinculos/profissionais')
      .then(({ data }) => {
        if (!isCurrent) return
        const activeProfessionals = Array.isArray(data) ? data : []
        const savedTicket = getAcceptedTicket(student.id)
        const savedProfessional = activeProfessionals.find((professional) => (
          (savedTicket?.professionalId && professional.id === savedTicket.professionalId)
          || (savedTicket?.professionalEmail && professional.email === savedTicket.professionalEmail)
        ))
        const linkedProfessional = savedProfessional || activeProfessionals[0]

        if (linkedProfessional) {
          setAcceptedInvite({ profissional: linkedProfessional })
          setCode(savedProfessional ? savedTicket?.code || '' : '')
          setAccepted(true)
        } else {
          setAcceptedInvite(null)
          setAccepted(false)
          setCode('')
        }
      })
      .catch((error) => {
        if (isCurrent) setLinksError(getApiErrorMessage(error, 'Não foi possível carregar seus profissionais vinculados.'))
      })
      .finally(() => {
        if (isCurrent) setIsLoadingLinks(false)
      })

    return () => { isCurrent = false }
  }, [student?.id, student?.profile, linksAttempt])

  function handleCodeChange(event) {
    const value = event.target.value.toUpperCase().replace(/\s/g, '')
    if (!CODE_CHARACTERS.test(value)) return
    setCode(value.slice(0, 8))
    setInvite(null)
    setMessage('')
  }

  async function handleLookup(event) {
    event.preventDefault()
    if (code.length !== 8) {
      setMessage('Digite os 8 caracteres do código enviado pelo profissional.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setInvite(null)
    try {
      const { data } = await api.get(`/vinculos/convites/${encodeURIComponent(code)}`)
      setInvite(data)
      setIsCuttingTicket(true)
      window.setTimeout(() => setIsCuttingTicket(false), 1350)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível consultar este convite.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAccept() {
    setIsAccepting(true)
    setMessage('')
    try {
      await api.post(`/vinculos/convites/${encodeURIComponent(code)}/aceitar`)
      setAcceptedInvite(invite)
      setAccepted(true)
      setIsAddingProfessional(false)
      setInvite(null)
      try {
        localStorage.setItem(`${ACCEPTED_TICKET_STORAGE_PREFIX}${student.id}`, JSON.stringify({
          code,
          professionalId: invite?.profissional?.id,
          professionalEmail: invite?.profissional?.email,
        }))
      } catch {
        // Mantém a confirmação nesta visita; a consulta à API ainda recupera o vínculo ativo.
      }
      try {
        const { data } = await api.get('/vinculos/profissionais')
        const activeProfessionals = Array.isArray(data) ? data : []
        const linkedProfessional = activeProfessionals.find((professional) => (
          (invite?.profissional?.id && professional.id === invite.profissional.id)
          || (invite?.profissional?.email && professional.email === invite.profissional.email)
        ))
        if (linkedProfessional) setAcceptedInvite({ profissional: linkedProfessional })
        setLinksError('')
      } catch (error) {
        setLinksError(getApiErrorMessage(error, 'Vínculo aceito. Não foi possível atualizar a lista de profissionais.'))
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível aceitar o convite.'))
    } finally {
      setIsAccepting(false)
    }
  }

  const passInvite = isAddingProfessional && invite ? invite : accepted ? acceptedInvite : invite
  const professional = passInvite?.profissional

  return (
    <main className="start-session-page invite-page">
      <header className="session-header invite-header">
        <div className="session-brand"><BrandLogo className="session-brand-logo" to="/home" /></div>
      </header>

      <section className="invite-content" aria-labelledby="invite-title">
        <div className="invite-card">
          <p className="invite-eyebrow">CONEXÃO COM SEU PROFISSIONAL</p>
          <h1 id="invite-title">Vincular profissional</h1>
          <p className="invite-description">Digite o código de convite que seu profissional compartilhou com você.</p>

          {student?.profile === 'STUDENT' && isLoadingLinks && <p className="invite-links-loading" role="status">Carregando seus vínculos...</p>}
          {student?.profile === 'STUDENT' && linksError && !isLoadingLinks && (
            <div className="invite-links-error" role="alert">
              <p>{linksError}</p>
              <StudentButton variant="secondary" onClick={() => setLinksAttempt((attempt) => attempt + 1)}>Tentar novamente</StudentButton>
            </div>
          )}

          {accepted && !isAddingProfessional ? (
            <div className="invite-active-actions">
              <p className="invite-confirmation" role="status">Vínculo ativo! Seu profissional já pode acompanhar seus treinos.</p>
              <StudentButton variant="secondary" onClick={() => { setCode(''); setInvite(null); setMessage(''); setIsAddingProfessional(true) }}>
                Vincular outro profissional
              </StudentButton>
            </div>
          ) : (
            <>
              <form className={`invite-form${isCuttingTicket ? ' is-cutting' : ''}`} onSubmit={handleLookup}>
                <div className="invite-form-body">
                  <label htmlFor="invite-code">Código do convite</label>
                  <div className="invite-input-row">
                    <input
                      id="invite-code"
                      name="code"
                      type="text"
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="EX: 4K8M2PQT"
                      autoComplete="off"
                      autoCapitalize="characters"
                      maxLength={8}
                      aria-describedby="invite-code-hint"
                    />
                  </div>
                  <span id="invite-code-hint" className="invite-hint">O código tem 8 letras ou números.</span>
                </div>
                <div className="invite-code-stub">
                  <span>DESHI PASS</span>
                  <StudentButton variant="icon" type="submit" aria-label={isLoading ? 'Consultando convite' : 'Confirmar código do convite'} disabled={isLoading || code.length !== 8}>
                    {isLoading ? <span className="invite-check-loading" aria-label="Consultando convite">…</span> : <span aria-hidden="true">✓</span>}
                  </StudentButton>
                  <strong>CONVITE</strong>
                </div>
                {isCuttingTicket && <span className="invite-scissors" aria-hidden="true">✂</span>}
              </form>

              {message && <p className="invite-message" role="alert">{message}</p>}
              {accepted && isAddingProfessional && (
                <StudentButton variant="secondary" className="invite-cancel-add" onClick={() => { setIsAddingProfessional(false); setCode(''); setInvite(null); setMessage('') }}>
                  Voltar ao passe ativo
                </StudentButton>
              )}

            </>
          )}

          {passInvite && (
            <section className={`training-pass${accepted ? ' is-active' : ''}`} aria-labelledby="training-pass-title">
              <div className="training-pass-main">
                <div className="training-pass-topline">
                  <span className="training-pass-brand"><BrandLogo className="training-pass-logo" variant="dark" /><span>TRAINING</span></span>
                  <span className="training-pass-status"><i />{accepted ? 'VÍNCULO ATIVO' : 'CONVITE PENDENTE'}</span>
                </div>
                <h2 id="training-pass-title">Passe de treino</h2>
                <div className="training-pass-route">
                  <div className="training-pass-person">
                  <span>ALUNO</span>
                    <strong>{student?.name || 'Você'}</strong>
                  </div>
                  <div className="training-pass-connector" aria-hidden="true"><span>✦</span></div>
                  <div className="training-pass-person training-pass-destination">
                    <span>PROFISSIONAL</span>
                    <strong>{professional?.name || 'Seu profissional'}</strong>
                  </div>
                </div>
                <div className="training-pass-details">
                  <div><span>PROFISSIONAL</span><strong>{professional?.email || 'Convite Deshi'}</strong></div>
                  <div><span>CÓDIGO</span><strong className="training-pass-code" title={code ? undefined : 'A API não fornece o código histórico deste convite.'}>{code || '—'}</strong></div>
                  <div><span>MODALIDADE</span><strong>Treinamento</strong></div>
                </div>
                {!accepted && (
                  <StudentButton variant="primary" type="button" particles className="invite-accept-button" onClick={handleAccept} busy={isAccepting}>
                    {isAccepting ? 'Confirmando vínculo...' : 'Aceitar convite'}
                  </StudentButton>
                )}
              </div>
              <div className="training-pass-stub" aria-label={`Código do convite ${code}`}>
                <span className="training-pass-stub-label">PASSE DE ACESSO</span>
                <div className="training-pass-barcode" aria-hidden="true" />
                <strong>{code || 'ATIVO'}</strong>
                <span>{accepted ? 'TREINO LIBERADO' : 'AGUARDANDO ACEITE'}</span>
              </div>
            </section>
          )}
        </div>
      </section>
      <StudentBottomNav active="invite" />
    </main>
  )
}

export default AcceptInvitePage
