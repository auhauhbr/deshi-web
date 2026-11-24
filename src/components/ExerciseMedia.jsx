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
  const videoRef = useRef(null)
  const [failedSrc, setFailedSrc] = useState(null)
  const isVideo = Boolean(src) && isVideoUrl(src)

  useEffect(() => {
    const video = videoRef.current
    if (!preview || !isVideo || !video) return undefined

    const loadPreviewFrame = () => {
      video.preload = 'metadata'
      video.src = src
      video.load()
      video.pause()
    }
    const unloadPreview = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    if (!('IntersectionObserver' in window)) {
      loadPreviewFrame()
      return unloadPreview
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadPreviewFrame()
      else unloadPreview()
    }, { rootMargin: '100px', threshold: 0.01 })

    observer.observe(video)
    return () => {
      observer.disconnect()
      unloadPreview()
    }
  }, [isVideo, preview, src])

  if (!src || failedSrc === src) return fallback

  const handleError = () => setFailedSrc(src)

  return isVideo ? (
    <video
      ref={videoRef}
      className={className}
      src={preview ? undefined : src}
      aria-label={alt || undefined}
      autoPlay={autoPlay}
      muted
      loop={loop}
      playsInline
      controls={interactive && controls}
      disablePictureInPicture={!interactive}
      disableRemotePlayback={!interactive}
      tabIndex={interactive ? undefined : -1}
      preload={preview ? 'none' : 'metadata'}
      onError={handleError}
      onContextMenu={interactive ? undefined : (event) => event.preventDefault()}
    />
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={handleError}
    />
  )
}
