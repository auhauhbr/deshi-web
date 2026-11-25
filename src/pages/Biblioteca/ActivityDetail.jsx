import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowUpRight, Dumbbell, Layers3, Pencil, Tag } from 'lucide-react'
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
            <div className="activity-detail-heading__copy">
              <span className={`activity-detail-origin${activity.origem === 'PERSONALIZADA' ? ' is-custom' : ''}`}><Dumbbell size={14} aria-hidden="true" />{activity.origem === 'PERSONALIZADA' ? 'Criada por você' : 'Biblioteca de atividades'}</span>
              <h1>{activity.nome}</h1>
              {activity.descricao && <p>{activity.descricao}</p>}
            </div>
            {activity.origem === 'PERSONALIZADA' && <Link className="activity-detail-edit" aria-label="Editar atividade" to={`/atividades/${encodeURIComponent(activity.id)}/editar`} state={{ returnTo: `/biblioteca/atividades/${encodeURIComponent(activity.id)}` }}><Pencil size={15} aria-hidden="true" /><span>Editar atividade</span><ArrowUpRight className="activity-detail-edit__arrow" size={14} aria-hidden="true" /></Link>}
          </header>

          <div className="activity-detail-media" aria-label={`Demonstração de ${activity.nome}`}>
            <div className="activity-detail-media__stage">
              {activity.midiaUrl
                ? <ExerciseMedia src={activity.midiaUrl} alt={`Demonstração de ${activity.nome}`} className="activity-detail-video" autoPlay loop controls={false} interactive={false} fallback={<div className="activity-detail-no-media"><Dumbbell size={25} aria-hidden="true" /><p>Não foi possível carregar esta mídia. Confira se o link é direto para o arquivo.</p></div>} />
                : <div className="activity-detail-no-media"><Dumbbell size={25} aria-hidden="true" /><p>Vídeo não disponível para esta atividade.</p></div>}
            </div>
            <div className="activity-detail-media__caption"><span><span className="activity-detail-media__live" aria-hidden="true" />Demonstração do movimento</span><span>{activity.midiaUrl ? 'Reprodução contínua' : 'Sem mídia cadastrada'}</span></div>
          </div>

          <section className="activity-detail-information" aria-label="Informações do exercício">
            <div><span className="activity-detail-information__icon"><Dumbbell size={16} aria-hidden="true" /></span><span className="activity-detail-information__copy"><span>Grupo muscular</span><strong>{activity.grupoMuscular || 'Não informado'}</strong></span></div>
            <div><span className="activity-detail-information__icon"><Tag size={16} aria-hidden="true" /></span><span className="activity-detail-information__copy"><span>Categoria</span><strong>{category}</strong></span></div>
            {activity.categoria && modality && <div><span className="activity-detail-information__icon"><Layers3 size={16} aria-hidden="true" /></span><span className="activity-detail-information__copy"><span>Modalidade</span><strong>{modality}</strong></span></div>}
          </section>
          {catalog.error && <p className="activity-detail-note">A modalidade desta atividade não pôde ser carregada.</p>}
        </article>}
      </div>
    </main>
  )
}
