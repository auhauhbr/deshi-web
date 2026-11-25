import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StudentBottomNav from '../../components/StudentBottomNav.jsx'
import StudentButton from '../../components/StudentButton.jsx'
import BrandLogo from '../../components/BrandLogo.jsx'
import { registerExecution } from '../../services/sessionService.js'
import { getApiErrorMessage } from '../../services/authService.js'
import './StartSession.css'
import './SessionDetails.css'
import './RegisterExecution.css'

const clock = (ms = 0) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function RegisterExecution() {
  const { sessionId, activityId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = state?.session
  const activity = state?.activity
  const finalSet = state?.finalSeries
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const series = [...(activity?.execution?.series || []), ...(finalSet ? [finalSet] : [])]

  async function confirm() {
    if (!session || !activity || !finalSet) return
    setBusy(true)
    setError('')
    try {
      const updated = await registerExecution(sessionId, { activityId, seriesNumber: finalSet.number, values: finalSet.values, durationMs: finalSet.durationMs, restMs: finalSet.restMs || 0, status: 'COMPLETED', comment })
      navigate(`/sessions/${sessionId}`, { replace: true, state: { session: updated, activity: updated.activities.find((item) => item.activityId === activityId), programName: state.programName } })
    } catch (failure) { setError(getApiErrorMessage(failure, 'Não foi possível confirmar a execução.')) }
    finally { setBusy(false) }
  }

  return <main className="start-session-page">
    <header className="session-header"><div className="session-brand"><BrandLogo className="session-brand-logo" variant="adaptive" to="/home" /></div><span className="session-header-label">Resumo da execução</span></header>
    <section className="session-details-content">
      <div className="session-heading"><p className="session-eyebrow">ATIVIDADE {activity?.order || ''}</p><h1>Como foi sua execução?</h1><p>Confira suas séries antes de confirmar para seu profissional.</p></div>
      {!session || !activity || !finalSet ? <article className="session-details-card">Resumo indisponível. Volte à sessão e conclua as séries para continuar.</article> : <article className="session-details-card execution-summary-card">
        <h2>{activity.nome || 'Atividade'}</h2>
        <div className="execution-summary-list">{series.map((set) => <div className="execution-summary-row" key={set.number}>
          <strong>Série {set.number}</strong><span>{set.values.repeticoes} repetições</span><span>{set.values.cargaKg} kg</span><span>Execução {clock(set.durationMs)}</span><span>Descanso {clock(set.restMs)}</span>
        </div>)}</div>
        <label className="execution-summary-comment">Comentário para seu profissional<textarea rows="4" maxLength="2000" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Como você se sentiu? Deixe uma observação sobre este exercício." /></label>
        {error && <p className="session-message" role="alert">{error}</p>}
        <div className="execution-actions"><StudentButton variant="secondary" className="session-secondary-button" onClick={() => navigate(-1)} disabled={busy}>Voltar</StudentButton><StudentButton particles className="session-start-button" onClick={confirm} busy={busy}>{busy ? 'Confirmando...' : 'Confirmar execução'}</StudentButton></div>
      </article>}
    </section><StudentBottomNav active="todo" />
  </main>
}
