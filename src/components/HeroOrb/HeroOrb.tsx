import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useIsMobileViewport } from '../../hooks/useIsMobileViewport'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useWebGLSupport } from '../../hooks/useWebGLSupport'
import HeroOrbFallback from './HeroOrbFallback'
import './HeroOrb.css'

const HeroOrbScene = lazy(() => import('./HeroOrbScene'))

function HeroOrb() {
  const containerRef = useRef<HTMLDivElement>(null)
  const webglSupported = useWebGLSupport()
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileViewport()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? true)
      },
      { rootMargin: '12% 0px', threshold: 0.05 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const useFallback = !webglSupported

  return (
    <div
      ref={containerRef}
      className={`hero-orb${reducedMotion || useFallback ? ' hero-orb--static' : ''}`}
      aria-hidden="true"
    >
      <div className="hero-orb__stage">
        {useFallback ? (
          <HeroOrbFallback />
        ) : (
          <Suspense fallback={<HeroOrbFallback />}>
            <HeroOrbScene
              reducedMotion={reducedMotion}
              isMobile={isMobile}
              isVisible={isVisible}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default HeroOrb
