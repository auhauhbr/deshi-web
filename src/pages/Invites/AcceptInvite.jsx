import { useState } from 'react'
import BrandLogo from '../../components/BrandLogo.jsx'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import { getApiErrorMessage, getStoredUser } from '../../services/authService.js'
import { api } from '../../services/api.js'
import '../Sessions/StartSession.css'
import '../Home/Home.css'
import './AcceptInvite.css'

const CODE_CHARACTERS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/

function AcceptInvitePage() {
  const [code, setCode] = useState('')
  const [invite, setInvite] = useState(null)
  const [acceptedInvite, setAcceptedInvite] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCuttingTicket, setIsCuttingTicket] = useState(false)
  const [accepted, setAccepted] = useState(false)

  function handleCodeChange(event) {
    const value = event.target.value.toUpperCase().replace(/\s/g, '')
    if (!CODE_CHARACTERS.test(value)) return
    setCode(value.slice(0, 8))
    setInvite(null)
    setAcceptedInvite(null)
    setMessage('')
    setAccepted(false)
  }

  async function handleLookup(event) {
    event.preventDefault()
    if (code.length !== 8) {
      setMessage('Digite os 8 caracteres do código enviado pelo personal.')
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
      setInvite(null)
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Não foi possível aceitar o convite.'))
    } finally {
      setIsAccepting(false)
    }
  }

  const student = getStoredUser()
  const passInvite = accepted ? acceptedInvite : invite
  const professional = passInvite?.profissional

  return (
    <main className="start-session-page invite-page">
      <header className="session-header invite-header">
        <div className="session-brand"><BrandLogo className="session-brand-logo" to="/home" /></div>
      </header>

      <section className="invite-content" aria-labelledby="invite-title">
        <div className="invite-card">
          <p className="invite-eyebrow">CONEXÃO COM SEU PERSONAL</p>
          <h1 id="invite-title">Vincular personal</h1>
          <p className="invite-description">Digite o código de convite que seu personal compartilhou com você.</p>

          {accepted ? (
            <p className="invite-confirmation" role="status">Vínculo ativo! Seu personal já pode acompanhar seus treinos.</p>
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
                  <button type="submit" aria-label={isLoading ? 'Consultando convite' : 'Confirmar código do convite'} disabled={isLoading || code.length !== 8}>
                    {isLoading ? <span className="invite-check-loading" aria-label="Consultando convite">…</span> : <span aria-hidden="true">✓</span>}
                  </button>
                  <strong>CONVITE</strong>
                </div>
                {isCuttingTicket && <span className="invite-scissors" aria-hidden="true">✂</span>}
              </form>

              {message && <p className="invite-message" role="alert">{message}</p>}

            </>
          )}

          {passInvite && (
            <section className={`training-pass${accepted ? ' is-active' : ''}`} aria-labelledby="training-pass-title">
              <div className="training-pass-main">
                <div className="training-pass-topline">
                  <span className="training-pass-brand"><span className="training-pass-mark" aria-hidden="true">D</span> DESHI TRAINING</span>
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
                    <span>PERSONAL</span>
                    <strong>{professional?.name || 'Seu personal'}</strong>
                  </div>
                </div>
                <div className="training-pass-details">
                  <div><span>PROFISSIONAL</span><strong>{professional?.email || 'Convite Deshi'}</strong></div>
                  <div><span>CÓDIGO</span><strong className="training-pass-code">{code}</strong></div>
                  <div><span>MODALIDADE</span><strong>Treinamento</strong></div>
                </div>
                {!accepted && (
                  <button type="button" className="invite-accept-button" onClick={handleAccept} disabled={isAccepting}>
                    {isAccepting ? 'Confirmando vínculo...' : 'Aceitar convite'}
                  </button>
                )}
              </div>
              <div className="training-pass-stub" aria-label={`Código do convite ${code}`}>
                <span className="training-pass-stub-label">PASSE DE ACESSO</span>
                <div className="training-pass-barcode" aria-hidden="true" />
                <strong>{code}</strong>
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
