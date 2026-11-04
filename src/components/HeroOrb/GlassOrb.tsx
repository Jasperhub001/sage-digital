import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import {
  type Group,
  type Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  type Texture,
} from 'three'
import OrbParticles from './OrbParticles'
import OrbRings from './OrbRings'

interface GlassOrbProps {
  envMap: Texture | null
  reducedMotion: boolean
  isMobile: boolean
  pointer: RefObject<{ x: number; y: number }>
}

/** Right-biased rest so travel stays away from hero copy. */
const REST_X_DESKTOP = 0.42
const REST_X_MOBILE = 0.12
const MIN_X_DESKTOP = 0.08
const MIN_X_MOBILE = -0.2
const MAX_X_DESKTOP = 0.95
const MAX_X_MOBILE = 0.55
const MIN_Y = -0.38
const MAX_Y = 0.42

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function GlassOrb({
  envMap,
  reducedMotion,
  isMobile,
  pointer,
}: GlassOrbProps) {
  const rootRef = useRef<Group>(null)
  const shellSpinRef = useRef<Group>(null)
  const shellRef = useRef<Mesh>(null)
  const coreRef = useRef<Mesh>(null)
  const haloRef = useRef<Mesh>(null)
  const entrance = useRef(0)
  const pointerSmooth = useRef({ x: 0, y: 0 })
  // HD 520-friendly tessellation — transmission cost scales with fragments
  const segments = isMobile ? 32 : 48

  useFrame((state, delta) => {
    const root = rootRef.current
    if (!root) return

    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const restX = isMobile ? REST_X_MOBILE : REST_X_DESKTOP
    const minX = isMobile ? MIN_X_MOBILE : MIN_X_DESKTOP
    const maxX = isMobile ? MAX_X_MOBILE : MAX_X_DESKTOP

    if (reducedMotion) {
      entrance.current = 1
      root.scale.setScalar(isMobile ? 0.88 : 1)
      root.position.set(restX, 0.04, 0)
      root.rotation.set(0.12, 0.35, 0)
      if (shellSpinRef.current) shellSpinRef.current.rotation.set(0.2, 0.55, 0.1)
      return
    }

    entrance.current = Math.min(1, entrance.current + dt * 0.65)
    const ease = 1 - (1 - entrance.current) ** 3
    const baseScale = isMobile ? 0.88 : 1
    root.scale.setScalar((0.64 + 0.36 * ease) * baseScale)

    // Wider organic float — layered sines, not frantic noise
    const floatX =
      Math.sin(t * 0.27) * 0.3 +
      Math.sin(t * 0.11 + 0.6) * 0.14 +
      Math.cos(t * 0.19) * 0.06
    const floatY =
      Math.sin(t * 0.33) * 0.26 +
      Math.cos(t * 0.17 + 1.1) * 0.12 +
      Math.sin(t * 0.48) * 0.04
    const floatZ = Math.sin(t * 0.21 + 0.4) * 0.1

    // Subtle parallax only — must not dominate the path
    const targetX = pointer.current?.x ?? 0
    const targetY = pointer.current?.y ?? 0
    pointerSmooth.current.x +=
      (targetX - pointerSmooth.current.x) * Math.min(1, dt * 1.5)
    pointerSmooth.current.y +=
      (targetY - pointerSmooth.current.y) * Math.min(1, dt * 1.5)

    const mouseGain = isMobile ? 0.035 : 0.07
    const nextX = clamp(
      restX + floatX + pointerSmooth.current.x * mouseGain,
      minX,
      maxX,
    )
    const nextY = clamp(
      floatY + pointerSmooth.current.y * mouseGain * 0.55,
      MIN_Y,
      MAX_Y,
    )

    root.position.x = nextX
    root.position.y = nextY
    root.position.z = floatZ

    if (shellSpinRef.current) {
      shellSpinRef.current.rotation.y = t * 0.2
      shellSpinRef.current.rotation.x = 0.22 + Math.sin(t * 0.16) * 0.14
      shellSpinRef.current.rotation.z = Math.cos(t * 0.13) * 0.11
    }

    root.rotation.y = pointerSmooth.current.x * 0.08
    root.rotation.x = -pointerSmooth.current.y * 0.05

    const pulse = 0.62 + Math.sin(t * 0.95) * 0.2 + Math.sin(t * 0.31) * 0.08
    const coreMaterial = coreRef.current?.material
    if (coreMaterial instanceof MeshBasicMaterial) {
      coreMaterial.opacity = (isMobile ? 0.22 : 0.3) * pulse
    }
    const haloMaterial = haloRef.current?.material
    if (haloMaterial instanceof MeshBasicMaterial) {
      haloMaterial.opacity = (isMobile ? 0.035 : 0.05) * (0.85 + pulse * 0.25)
    }

    const shellMaterial = shellRef.current?.material
    if (shellMaterial instanceof MeshPhysicalMaterial) {
      shellMaterial.envMapIntensity = 2.05 + Math.sin(t * 0.45) * 0.1
    }
  })

  return (
    <group ref={rootRef} scale={reducedMotion ? 1 : 0.64}>
      <OrbRings reducedMotion={reducedMotion} isMobile={isMobile} />
      <OrbParticles reducedMotion={reducedMotion} isMobile={isMobile} />

      <group ref={shellSpinRef}>
        {/* Tiny warm veil — must not read as a gold plate */}
        <mesh ref={haloRef} scale={0.3} renderOrder={0}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#d4af37"
            transparent
            opacity={isMobile ? 0.035 : 0.05}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={coreRef} scale={0.13} renderOrder={1}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#f3e6c0"
            transparent
            opacity={isMobile ? 0.24 : 0.32}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={shellRef} renderOrder={2}>
          <sphereGeometry args={[1, segments, segments]} />
          <meshPhysicalMaterial
            color="#ffffff"
            metalness={0}
            roughness={0.025}
            transmission={1}
            thickness={isMobile ? 0.75 : 1.05}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.04}
            specularIntensity={1}
            specularColor="#f5f0e8"
            transparent
            opacity={1}
            envMap={envMap}
            envMapIntensity={2.1}
            attenuationColor="#f2ead2"
            attenuationDistance={14}
            reflectivity={0.45}
          />
        </mesh>
      </group>
    </group>
  )
}

export default GlassOrb
