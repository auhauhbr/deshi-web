import { Link, useNavigate } from 'react-router-dom'
import ExerciseMedia from './ExerciseMedia.jsx'

export default function ActivityListItem({ atividade, modalidade, programContext, alreadyAdded = false, returnTo = '/atividades' }) {
  const navigate = useNavigate()
  const { nome, descricao, midiaUrl, grupoMuscular, origem } = atividade
  const emptyThumbnail = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m4 18 5-5 4 3 3-5 4 7" />
  </svg>

  const content = <>
        <div className="activity-thumbnail">
          {midiaUrl ? (
            <ExerciseMedia src={midiaUrl} alt={`Demonstração de ${nome}`} preview className="activity-thumbnail-media" fallback={emptyThumbnail} />
          ) : (
            emptyThumbnail
          )}
        </div>
        <div className="activity-info">
          <h2 className="activity-name">{nome}</h2>
          <p className="activity-modality">{modalidade}{grupoMuscular ? ` · ${grupoMuscular}` : ''}</p>
          {descricao && <p className="activity-description">{descricao}</p>}
        </div>
        <div className="activity-actions">
          <span className={`activity-origin${origem === 'PERSONALIZADA' ? ' activity-origin-mine' : ''}`}>
            {origem === 'PERSONALIZADA' ? 'Minha' : 'Padrão'}
          </span>
          {programContext && <span className="activity-add-label">{alreadyAdded ? 'Adicionada' : 'Adicionar'}</span>}
          <span className="navigation-chevron" aria-hidden="true">›</span>
        </div>
  </>

  return <li>
    {programContext ? <button className={`activity-row activity-row--button${alreadyAdded ? ' is-added' : ''}`} type="button" disabled={alreadyAdded} aria-label={alreadyAdded ? `${nome} já adicionada ao programa` : `Adicionar ${nome} ao programa`} onClick={() => navigate(`/atividades/${encodeURIComponent(atividade.id)}/configurar`, { state: { ...programContext, atividadeSelecionada: atividade } })}>{content}</button> : <Link className="activity-row" to={`/atividades/${encodeURIComponent(atividade.id)}/configurar`} state={{ returnTo }} aria-label={`Configurar ${nome}`}>{content}</Link>}
  </li>
}
