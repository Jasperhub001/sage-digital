import { useEffect, useRef } from 'react'

/**
 * Adds `is-visible` when the element enters the viewport.
 * Respects `prefers-reduced-motion` by revealing immediately.
 */
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reveal = () => element.classList.add('is-visible')

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        reveal()
        observer.unobserve(element)
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)

    // Failsafe: never leave content permanently hidden if IO never fires
    const failsafe = window.setTimeout(reveal, 1800)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return ref
}
