import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Color, Points } from 'three'

interface OrbParticlesProps {
  reducedMotion: boolean
  isMobile: boolean
}

interface ParticleSeed {
  radius: number
  speed: number
  phase: number
  elev: number
  bob: number
}

function OrbParticles({ reducedMotion, isMobile }: OrbParticlesProps) {
  const pointsRef = useRef<Points>(null)
  // Keep sparse for Intel HD 520 fill-rate / shared memory
  const count = isMobile ? 10 : 16

  const { geometry, seeds } = useMemo(() => {
    const seeds: ParticleSeed[] = Array.from({ length: count }, (_, index) => {
      const t = index / count
      return {
        radius: 1.32 + (index % 5) * 0.11 + t * 0.18,
        speed: 0.16 + (index % 7) * 0.035,
        phase: t * Math.PI * 2,
        elev: ((index % 5) - 2) * 0.22,
        bob: 0.12 + (index % 3) * 0.04,
      }
    })

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const gold = new Color('#d4af37')
    const cream = new Color('#f5f0e8')

    for (let i = 0; i < count; i += 1) {
      const mix = i % 3 === 0 ? cream : gold
      colors[i * 3] = mix.r
      colors[i * 3 + 1] = mix.g
      colors[i * 3 + 2] = mix.b
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))

    return { geometry, seeds }
  }, [count])

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return

    const position = points.geometry.getAttribute('position')
    if (!position) return

    const t = reducedMotion ? 0 : state.clock.elapsedTime

    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i]
      if (!seed) continue

      const angle = seed.phase + t * seed.speed
      const y =
        seed.elev +
        (reducedMotion ? 0 : Math.sin(angle * 1.35 + seed.phase) * seed.bob)

      position.setXYZ(
        i,
        Math.cos(angle) * seed.radius,
        y,
        Math.sin(angle) * seed.radius * 0.82,
      )
    }

    position.needsUpdate = true
    if (!reducedMotion) points.rotation.y = t * 0.07
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={isMobile ? 0.028 : 0.035}
        sizeAttenuation
        vertexColors
        transparent
        opacity={isMobile ? 0.45 : 0.7}
        depthWrite={false}
      />
    </points>
  )
}

export default OrbParticles
