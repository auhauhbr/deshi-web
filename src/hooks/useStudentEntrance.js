import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

export function useStudentEntrance(dependencies = []) {
  const rootRef = useRef(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-student-enter]', {
        y: 12,
        autoAlpha: 0,
        duration: 0.32,
        stagger: 0.045,
        ease: 'power2.out',
        clearProps: 'all',
      })
    })
    return () => media.revert()
  }, { scope: rootRef, dependencies, revertOnUpdate: true })

  return rootRef
}
