import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Clock3, MessageSquareText, UserRound } from 'lucide-react'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import AccountMenu from '../../components/AccountMenu.jsx'
import FadeContent from '../../components/FadeContent.jsx'
import SlideTextButton from '../../components/kokonutui/slide-text-button.jsx'
import { getProfessionalSession } from '../../services/sessionService.js'
import { getApiErrorMessage } from '../../services/authService.js'
import { METRICAS_ATIVIDADE, UNIDADES_ATIVIDADE } from '../../utils/metricas-atividade.js'
import './ProfessionalSessionDetails.css'

function formatDateTime(value) {
  if (!value) return 'Não informado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatDuration(milliseconds = 0) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours
    ? `${hours}h ${String(minutes).padStart(2, '0')}min`
    : minutes ? `${minutes}min ${String(remainder).padStart(2, '0')}s` : `${remainder}s`
}

function getSessionDuration(session) {
  if (Number.isFinite(session.durationMs)) return session.durationMs
  if (!session.startedAt || !session.finishedAt) return 0
  return Math.max(0, new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime() - (session.pausedDurationMs || 0))
}

function formatMetricValue(key, value) {
  const metric = METRICAS_ATIVIDADE[key]
  const formatted = typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value) : value
  if (metric?.tipo === 'duracao') return `${formatDuration(Number(value) * 1000)}`
  const unit = metric?.unidade ? UNIDADES_ATIVIDADE[metric.unidade] || metric.unidade : ''
  return `${formatted}${unit ? ` ${unit}` : ''}`
}

function MetricList({ values }) {
  const entries = Object.entries(values || {}).filter(([key]) => Object.hasOwn(METRICAS_ATIVIDADE, key))
  if (!entries.length) return <span className="professional-session__no-data">Sem registro</span>
  return <dl className="professional-session__metrics">
    {entries.map(([key, value]) => <div key={key}>
      <dt>{METRICAS_ATIVIDADE[key].label}</dt>
      <dd>{formatMetricValue(key, value)}</dd>
    </div>)}
  </dl>
}

function ExerciseCard({ activity, index }) {
  const series = activity.execution?.series || []
  const isRoundBased = Object.hasOwn(activity.prescribed || {}, 'rounds') || Object.hasOwn(activity.prescribed || {}, 'duracaoRoundSegundos')
  const status = activity.status === 'COMPLETED' ? 'Concluída' : activity.status === 'INCOMPLETE' ? 'Interrompida' : 'Sem execução'

  return <article className="professional-session__exercise">
    <header className="professional-session__exercise-heading">
      <span className="professional-session__exercise-order" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="professional-session__exercise-title">
        <h3>{activity.nome || `Atividade ${index + 1}`}</h3>
        {activity.grupoMuscular && <span>{activity.grupoMuscular}</span>}
      </div>
      <span className={`professional-session__status professional-session__status--${activity.status === 'COMPLETED' ? 'done' : 'muted'}`}>{status}</span>
    </header>

    <div className="professional-session__exercise-values">
      <section aria-label={`Prescrição de ${activity.nome || `atividade ${index + 1}`}`}>
        <h4>Prescrito</h4>
        <MetricList values={activity.prescribed} />
      </section>
      <section aria-label={`Execução de ${activity.nome || `atividade ${index + 1}`}`}>
        <h4>Realizado</h4>
        <MetricList values={activity.execution?.values} />
      </section>
    </div>

    {series.length > 0 && <section className="professional-session__series" aria-label={`Séries feitas de ${activity.nome}`}>
      <h4>Registro por série</h4>
      <ol>
        {series.map((set, setIndex) => <li key={`${set.number ?? setIndex}-${set.executedAt ?? setIndex}`}>
          <strong>{isRoundBased ? `Round ${set.number || setIndex + 1}` : `Série ${set.number || setIndex + 1}`}</strong>
          <MetricList values={set.values} />
          <span>Execução <b>{formatDuration(set.durationMs || 0)}</b></span>
          {set.restMs != null && <span>Descanso <b>{formatDuration(set.restMs)}</b></span>}
        </li>)}
      </ol>
    </section>}

    <section className={`professional-session__comment${activity.execution?.comment ? ' has-comment' : ''}`} aria-label={`Comentário sobre ${activity.nome || `atividade ${index + 1}`}`}>
      <MessageSquareText size={17} aria-hidden="true" />
      <div>
        <h4>Comentário do aluno</h4>
        {activity.execution?.comment
          ? <blockquote>{activity.execution.comment}</blockquote>
          : <p>Nenhum comentário nesta execução.</p>}
      </div>
    </section>

    {!!activity.observations?.length && <section className="professional-session__observations">
      <h4>Observações durante a sessão</h4>
      <ul>{activity.observations.map((observation, observationIndex) => <li key={`${observationIndex}-${observation}`}>{observation}</li>)}</ul>
    </section>}
  </article>
}

export default function ProfessionalSessionDetails() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getProfessionalSession(sessionId)
      .then((data) => { if (active) setSession(data) })
      .catch((failure) => { if (active) setError(getApiErrorMessage(failure, 'Não foi possível carregar os dados desta sessão.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [sessionId])

  const activities = useMemo(() => [...(session?.activities || [])].sort((a, b) => a.order - b.order), [session?.activities])
  const completedCount = activities.filter((activity) => activity.status === 'COMPLETED').length
  const commentCount = activities.filter((activity) => activity.execution?.comment?.trim()).length
  const statusLabel = session?.status === 'COMPLETED' ? 'Sessão concluída' : session?.status === 'INTERRUPTED' ? 'Sessão interrompida' : session?.status === 'PAUSED' ? 'Sessão pausada' : 'Sessão em andamento'

  return <main className="professional-session-page">
    <ProfessionalNavigation />
    <div className="professional-session-page__container">
      <header className="professional-session-page__topbar">
        <SlideTextButton className="professional-session-page__back" variant="ghost" text="Voltar à atividade recente" hoverText="Voltar para início" to="/home" animateIn={false} />
        <AccountMenu fallbackLabel="Profissional" />
      </header>

      {loading ? <div className="professional-session-page__state" role="status" aria-live="polite">
        <span className="professional-session-page__skeleton professional-session-page__skeleton--title" />
        <span className="professional-session-page__skeleton" />
        <span className="professional-session-page__skeleton professional-session-page__skeleton--block" />
        <span>Carregando sessão…</span>
      </div> : error ? <div className="professional-session-page__state is-error" role="alert">
        <h1>Não foi possível abrir esta sessão</h1><p>{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); getProfessionalSession(sessionId).then(setSession).catch((failure) => setError(getApiErrorMessage(failure, 'Tente novamente em instantes.'))).finally(() => setLoading(false)) }}>Tentar novamente</button>
      </div> : session && <FadeContent className="professional-session-page__content" trigger="mount" effect="focus" blur={5} duration={0.42} delay={0.03} stagger={0.06} ease="power3.out">
        <section className="professional-session__hero">
          <div className="professional-session__hero-title">
            <div>
              <span className={`professional-session__status professional-session__status--${session.status === 'COMPLETED' ? 'done' : session.status === 'INTERRUPTED' ? 'interrupted' : 'muted'}`}>{statusLabel}</span>
              <h1>{session.programName || 'Sessão de treino'}</h1>
              <p className="professional-session__student"><UserRound size={17} aria-hidden="true" />{session.studentName || 'Aluno'}</p>
            </div>
            <p className="professional-session__date">{formatDateTime(session.startedAt)}{session.finishedAt ? <> <span aria-hidden="true">·</span> {formatDateTime(session.finishedAt)}</> : null}</p>
          </div>

          <div className="professional-session__summary" aria-label="Resumo da sessão">
            <div><Clock3 size={17} aria-hidden="true" /><span>Duração</span><strong>{formatDuration(getSessionDuration(session))}</strong></div>
            <div><Activity size={17} aria-hidden="true" /><span>Atividades concluídas</span><strong>{completedCount} <small>de {activities.length}</small></strong></div>
            <div><MessageSquareText size={17} aria-hidden="true" /><span>Comentários</span><strong>{commentCount}</strong></div>
          </div>
        </section>

        <section className="professional-session__activity-section" aria-labelledby="professional-session-activities-title">
          <header className="professional-session__section-heading">
            <div><h2 id="professional-session-activities-title">Execução por exercício</h2><p>Prescrição, resultado e comentários registrados pelo aluno.</p></div>
            <span>{activities.length} {activities.length === 1 ? 'exercício' : 'exercícios'}</span>
          </header>

          {activities.length ? <div className="professional-session__exercise-list">
            {activities.map((activity, index) => <ExerciseCard key={activity.activityId} activity={activity} index={index} />)}
          </div> : <div className="professional-session__empty"><Activity size={22} aria-hidden="true" /><h3>Esta sessão não tem exercícios registrados</h3><p>Os detalhes aparecerão aqui quando houver atividades nesta sessão.</p></div>}
        </section>
      </FadeContent>}
    </div>
  </main>
}
