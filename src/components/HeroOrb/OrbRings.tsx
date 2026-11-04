import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'

interface OrbRingsProps {
  reducedMotion: boolean
  isMobile: boolean
}

function OrbRings({ reducedMotion, isMobile }: OrbRingsProps) {
  const outerRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)
  const tube = isMobile ? 0.007 : 0.009
  const radial = isMobile ? 48 : 72

  useFrame((state, delta) => {
    if (reducedMotion) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (outerRef.current) {
      outerRef.current.rotation.x = 0.55 + Math.sin(t * 0.15) * 0.04
      outerRef.current.rotation.y += dt * 0.22
      outerRef.current.rotation.z = 0.2
    }

    if (innerRef.current) {
      innerRef.current.rotation.x = -0.85
      innerRef.current.rotation.y -= dt * 0.34
      innerRef.current.rotation.z = 0.55 + Math.cos(t * 0.2) * 0.05
    }
  })

  return (
    <group>
      <group ref={outerRef} rotation={[0.55, 0, 0.2]}>
        <Ring
          radius={1.18}
          tube={tube}
          radial={radial}
          opacity={isMobile ? 0.45 : 0.62}
        />
      </group>
      <group ref={innerRef} rotation={[-0.85, 0.4, 0.55]}>
        <Ring
          radius={1.08}
          tube={tube * 0.85}
          radial={radial}
          opacity={isMobile ? 0.32 : 0.48}
          warmer
        />
      </group>
    </group>
  )
}

function Ring({
  radius,
  tube,
  radial,
  opacity,
  warmer = false,
}: {
  radius: number
  tube: number
  radial: number
  opacity: number
  warmer?: boolean
}) {
  const meshRef = useRef<Mesh>(null)

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 6, radial]} />
      <meshStandardMaterial
        color={warmer ? '#e0c56a' : '#d4af37'}
        emissive={warmer ? '#c9a227' : '#d4af37'}
        emissiveIntensity={0.35}
        metalness={0.95}
        roughness={0.22}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

export default OrbRings
