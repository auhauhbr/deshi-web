import { useEffect, useRef, useState } from 'react'

function isVideoUrl(src) {
  try {
    return /\.(mp4|webm|ogv)$/i.test(new URL(src, window.location.href).pathname)
  } catch {
    return false
  }
}

export default function ExerciseMedia({
  src,
  alt = '',
  className,
  fallback = null,
  preview = false,
  autoPlay = false,
  loop = preview,
  controls = !preview,
  interactive = true,
}) {
  const mediaRef = useRef(null)
  const [previewReady, setPreviewReady] = useState(!preview)
  const [failedSrc, setFailedSrc] = useState(null)
  const isVideo = Boolean(src) && isVideoUrl(src)

  useEffect(() => {
    if (!preview || !src) {
      setPreviewReady(true)
      return undefined
    }

    setPreviewReady(false)
    const media = mediaRef.current
    if (!media || !('IntersectionObserver' in window)) {
      setPreviewReady(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      // Load each preview once when it is close to the viewport. Keep it cached
      // after leaving view so scrolling back does not restart the network request.
      setPreviewReady(true)
      observer.disconnect()
    }, { rootMargin: '80px 0px', threshold: 0.01 })

    observer.observe(media)
    return () => observer.disconnect()
  }, [preview, src])

  if (!src || failedSrc === src) return fallback

  const handleError = () => setFailedSrc(src)

  return isVideo ? (
    <video
      ref={mediaRef}
      className={className}
      src={preview && !previewReady ? undefined : src}
      aria-label={alt || undefined}
      autoPlay={autoPlay}
      muted
      loop={loop}
      playsInline
      controls={interactive && controls}
      disablePictureInPicture={!interactive}
      disableRemotePlayback={!interactive}
      tabIndex={interactive ? undefined : -1}
      preload={preview && !previewReady ? 'none' : 'metadata'}
      onError={handleError}
      onContextMenu={interactive ? undefined : (event) => event.preventDefault()}
    />
  ) : (
    <img
      ref={mediaRef}
      className={className}
      src={preview && !previewReady ? undefined : src}
      alt={alt}
      loading={preview ? 'lazy' : 'eager'}
      decoding="async"
      onError={handleError}
    />
  )
}
