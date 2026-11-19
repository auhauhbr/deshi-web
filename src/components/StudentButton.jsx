import { useEffect, useRef, useState } from 'react'
import './StudentButton.css'

function StudentButton({ children, className = '', variant = 'primary', type = 'button', busy = false, disabled = false, particles = false, onClick, ...props }) {
  const [burst, setBurst] = useState(null)
  const burstId = useRef(0)
  const timeout = useRef(null)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  function handleClick(event) {
    onClick?.(event)
    if (!particles || event.defaultPrevented || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const originX = event.clientX === 0 && event.clientY === 0
      ? bounds.width / 2
      : Math.max(4, Math.min(bounds.width - 4, event.clientX - bounds.left))
    const pieces = Array.from({ length: 16 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 16 + (Math.random() - .5) * .45
      const distance = 20 + Math.random() * 36
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 8,
        rotation: Math.random() * 360 - 180,
        duration: 480 + Math.round(Math.random() * 160),
        size: index % 3 === 0 ? 5 : 3,
      }
    })

    burstId.current += 1
    setBurst({ id: burstId.current, originX, pieces })
    window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => setBurst(null), 700)
  }

  return (
    <button
      {...props}
      type={type}
      className={`student-button student-button--${variant} ${className}`.trim()}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={handleClick}
    >
      {children}
      {burst && (
        <span className={`student-particle-layer student-particle-layer--${variant}`} aria-hidden="true">
          {burst.pieces.map((piece, index) => (
            <i
              className="student-particle"
              key={`${burst.id}-${index}`}
              style={{
                left: burst.originX,
                width: piece.size,
                height: piece.size,
                '--particle-x': `${piece.x}px`,
                '--particle-y': `${piece.y}px`,
                '--particle-rotation': `${piece.rotation}deg`,
                '--particle-duration': `${piece.duration}ms`,
              }}
            />
          ))}
        </span>
      )}
    </button>
  )
}

export default StudentButton
