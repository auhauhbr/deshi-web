import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivityMedia } from '../utils/activity-media'

export default function ActivityListItem({ atividade, modalidade }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const { nome, descricao, origem } = atividade
  const media = getActivityMedia(atividade)
  const hasImage = media && failedUrl !== media.src

  return (
    <li>
      <Link className="activity-row" to={`/atividades/${encodeURIComponent(atividade.id)}/configurar`} aria-label={`Configurar ${nome}`}>
        <div className="activity-thumbnail">
          {hasImage ? (
            <img src={media.src} alt={media.alt} loading="lazy" onError={() => setFailedUrl(media.src)} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="m4 18 5-5 4 3 3-5 4 7" />
            </svg>
          )}
        </div>
        <div className="activity-info">
          <h2 className="activity-name">{nome}</h2>
          <p className="activity-modality">{modalidade}</p>
          {descricao && <p className="activity-description">{descricao}</p>}
        </div>
        <div className="activity-actions">
          <span className={`activity-origin${origem === 'PERSONALIZADA' ? ' activity-origin-mine' : ''}`}>
            {origem === 'PERSONALIZADA' ? 'Minha' : 'Padrão'}
          </span>
          <span className="navigation-chevron" aria-hidden="true">›</span>
        </div>
      </Link>
    </li>
  )
}
