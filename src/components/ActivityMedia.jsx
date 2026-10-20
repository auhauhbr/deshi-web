import { useState } from 'react'
import { getActivityMedia } from '../utils/activity-media'

export default function ActivityMedia({ atividade }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const [failedComplementaryUrl, setFailedComplementaryUrl] = useState(null)
  const [showComplementary, setShowComplementary] = useState(false)
  const media = getActivityMedia(atividade)

  if (!media || failedUrl === media.src) return null
  const complementary = media.complementary

  return (
    <div className="activity-demonstration">
      <img className="activity-demonstration-image" src={media.src} alt={media.alt} onError={() => setFailedUrl(media.src)} />
      {complementary && failedComplementaryUrl !== complementary.src && (
        <details className="activity-variation" onToggle={(event) => setShowComplementary(event.currentTarget.open)}>
          <summary>{complementary.caption}</summary>
          {showComplementary && (
            <img className="activity-demonstration-image" src={complementary.src} alt={complementary.alt} loading="lazy" onError={() => setFailedComplementaryUrl(complementary.src)} />
          )}
        </details>
      )}
    </div>
  )
}
