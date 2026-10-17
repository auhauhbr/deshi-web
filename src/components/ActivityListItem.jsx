import { useState } from 'react'

export default function ActivityListItem({ atividade, modalidade }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const { nome, descricao, midiaUrl, origem } = atividade
  const hasImage = /^https?:\/\//i.test(midiaUrl ?? '') && failedUrl !== midiaUrl

  return (
    <li className="activity-row">
      <div className="activity-thumbnail">
        {hasImage ? (
          <img src={midiaUrl} alt={`Imagem de ${nome}`} loading="lazy" onError={() => setFailedUrl(midiaUrl)} />
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
      <span className={`activity-origin${origem === 'PERSONALIZADA' ? ' activity-origin-mine' : ''}`}>
        {origem === 'PERSONALIZADA' ? 'Minha' : 'Padrão'}
      </span>
    </li>
  )
}
