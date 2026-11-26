import { useEffect, useRef, useState } from 'react'

function isVideoUrl(src) {
  try {
    return /\.(mp4|webm|ogv)$/i.test(new URL(src, window.location.href).pathname)
  } catch {
    return false
  }
}

const previewTargets = new Map()
let previewObserver

function observePreview(media, onVisible) {
  if (!('IntersectionObserver' in window)) {
    onVisible()
    return () => {}
  }

  if (!previewObserver) {
    previewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const showPreview = previewTargets.get(entry.target)
        previewTargets.delete(entry.target)
        previewObserver.unobserve(entry.target)
        showPreview?.()
      })
    }, { rootMargin: '80px 0px', threshold: 0.01 })
  }

  previewTargets.set(media, onVisible)
  previewObserver.observe(media)
  return () => {
    previewTargets.delete(media)
    previewObserver?.unobserve(media)
  }
}

export default function ExerciseMedia({
  src,
  alt = '',
  className,
  fallback = null,
  preview = false,
  autoPlay = false,
  shouldPlay = false,
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
    if (!media) {
      setPreviewReady(true)
      return undefined
    }
    // All cards share one observer. Load each preview once near the viewport,
    // then keep it cached so scrolling back does not restart the request.
    return observePreview(media, () => setPreviewReady(true))
  }, [preview, src])

  useEffect(() => {
    if (!isVideo) return
    const video = mediaRef.current
    if (!video) return

    if (shouldPlay) video.play().catch(() => {})
    else video.pause()
  }, [isVideo, shouldPlay, previewReady, src])

  if (!src || failedSrc === src) return fallback

  const handleError = () => setFailedSrc(src)

  return isVideo ? (
    <video
      ref={mediaRef}
      className={className}
      src={preview && !previewReady ? undefined : src}
      aria-label={alt || undefined}
      autoPlay={autoPlay || shouldPlay}
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
