import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ProfessionalNavigation from '../../components/ProfessionalNavigation.jsx'
import PageAppBar from '../../components/PageAppBar.jsx'
import ExerciseMedia from '../../components/ExerciseMedia.jsx'
import { useModalidadesCatalogo } from '../../hooks/useModalidadesCatalogo.js'
import { listarAtividades } from '../../services/atividades.service.js'
import './ActivityDetail.css'

export default function ActivityDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const catalog = useModalidadesCatalogo()
  const fromNavigation = location.state?.atividade?.id === id ? location.state.atividade : null
  const [state, setState] = useState({ id: null, phase: 'loading', activity: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const returnTo = location.state?.returnTo || '/biblioteca'
  const phase = fromNavigation ? 'ready' : state.id === id ? state.phase : 'loading'
  const activity = fromNavigation || (state.id === id ? state.activity : null)

  useEffect(() => {
    if (fromNavigation) return undefined
    const controller = new AbortController()
    listarAtividades({}, controller.signal)
      .then((activities) => {
        if (controller.signal.aborted) return
        const activity = activities.find((item) => item.id === id)
        setState(activity
          ? { id, phase: 'ready', activity, error: '' }
          : { id, phase: 'not-found', activity: null, error: 'Essa atividade não está disponível na sua biblioteca.' })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ id, phase: 'error', activity: null, error: error.message })
      })
    return () => controller.abort()
  }, [id, fromNavigation, attempt])

  const modality = catalog.modalidades.find((item) => item.id === activity?.modalidadeId)?.nome
  const category = activity?.categoria || modality || 'Sem categoria'

  return (
    <main className="activity-detail-page">
      <ProfessionalNavigation />
      <div className="activity-detail-content">
        <PageAppBar title="Detalhes do exercício" backTo={returnTo} backLabel="Voltar para a biblioteca" />
        {phase === 'loading' && <div className="activity-detail-state" role="status"><span className="loading-dot" aria-hidden="true" />Carregando exercício...</div>}
        {(phase === 'error' || phase === 'not-found') && <div className="activity-detail-state is-error"><p role="alert">{state.error}</p>{phase === 'error' && <button className="secondary-button compact-button" type="button" onClick={() => { setState({ id, phase: 'loading', activity: null, error: '' }); setAttempt((value) => value + 1) }}>Tentar novamente</button>}</div>}
        {phase === 'ready' && activity && <article className="activity-detail-card">
          <header className="activity-detail-heading">
            <div><span className="activity-detail-eyebrow">{activity.origem === 'PERSONALIZADA' ? 'ATIVIDADE PERSONALIZADA' : 'BIBLIOTECA DE ATIVIDADES'}</span><h1>{activity.nome}</h1>{activity.descricao && <p>{activity.descricao}</p>}</div>
            {activity.origem === 'PERSONALIZADA' && <Link className="activity-detail-edit" to={`/atividades/${encodeURIComponent(activity.id)}/editar`} state={{ returnTo: `/biblioteca/atividades/${encodeURIComponent(activity.id)}` }}>Editar atividade</Link>}
          </header>

          <div className="activity-detail-media" aria-label={`Demonstração em vídeo de ${activity.nome}`}>
            {activity.midiaUrl
              ? <ExerciseMedia src={activity.midiaUrl} alt={`Demonstração de ${activity.nome}`} className="activity-detail-video" autoPlay loop controls={false} interactive={false} fallback={<div className="activity-detail-no-media"><span aria-hidden="true">!</span><p>Não foi possível carregar esta mídia. Confira se o link é direto para o arquivo.</p></div>} />
              : <div className="activity-detail-no-media"><span aria-hidden="true">▶</span><p>Vídeo não disponível para esta atividade.</p></div>}
          </div>

          <section className="activity-detail-information" aria-label="Informações do exercício">
            <div><span>Grupo muscular</span><strong>{activity.grupoMuscular || 'Não informado'}</strong></div>
            <div><span>Categoria</span><strong>{category}</strong></div>
            {activity.categoria && modality && <div><span>Modalidade</span><strong>{modality}</strong></div>}
          </section>
          {catalog.error && <p className="activity-detail-note">A modalidade desta atividade não pôde ser carregada.</p>}
        </article>}
      </div>
    </main>
  )
}
