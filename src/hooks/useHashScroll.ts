import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to hash targets when navigating between routes
 * (e.g. /work/:slug → /#work), accounting for async home mount.
 */
export function useHashScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return

    const id = decodeURIComponent(hash.replace('#', ''))
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'

    let cancelled = false
    let attempts = 0
    let timer = 0

    const tryScroll = () => {
      if (cancelled) return
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior, block: 'start' })
        return
      }

      attempts += 1
      if (attempts < 12) {
        timer = window.setTimeout(tryScroll, 50)
      }
    }

    const frame = window.requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [pathname, hash])
}
