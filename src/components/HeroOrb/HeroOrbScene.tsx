import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ACESFilmicToneMapping,
  SRGBColorSpace,
  type Texture,
} from 'three'
import { createStudioEnvironment } from './createStudioEnvironment'
import GlassOrb from './GlassOrb'

interface HeroOrbSceneProps {
  reducedMotion: boolean
  isMobile: boolean
  isVisible: boolean
}

function StudioEnvironment({
  onReady,
}: {
  onReady: (texture: Texture) => void
}) {
  const { gl } = useThree()

  useEffect(() => {
    const envMap = createStudioEnvironment(gl)
    onReady(envMap)
    return () => {
      envMap.dispose()
    }
  }, [gl, onReady])

  return null
}

function SceneContent({
  reducedMotion,
  isMobile,
}: Omit<HeroOrbSceneProps, 'isVisible'>) {
  const [envMap, setEnvMap] = useState<Texture | null>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (reducedMotion) return

    const onPointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -((event.clientY / window.innerHeight) * 2 - 1)
      pointer.current.x = Math.max(-1, Math.min(1, x))
      pointer.current.y = Math.max(-1, Math.min(1, y))
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [reducedMotion])

  return (
    <>
      <StudioEnvironment onReady={setEnvMap} />

      <ambientLight intensity={0.12} color="#d0c9bc" />

      <directionalLight
        position={[4.4, 3.6, 2.8]}
        intensity={2.35}
        color="#fff8ee"
      />

      <directionalLight
        position={[-3.8, 1.0, -1.6]}
        intensity={1.55}
        color="#d4af37"
      />

      <pointLight
        position={[1.2, -2.0, 1.6]}
        intensity={0.45}
        color="#c9a227"
        distance={6}
        decay={2}
      />

      <pointLight
        position={[0.4, 0.8, 3.4]}
        intensity={0.7}
        color="#f5f0e8"
        distance={7}
        decay={2}
      />

      <GlassOrb
        envMap={envMap}
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        pointer={pointer}
      />
    </>
  )
}

function HeroOrbScene({
  reducedMotion,
  isMobile,
  isVisible,
}: HeroOrbSceneProps) {
  // Intel HD 520: keep fill-rate low (transmission is expensive per pixel)
  const dpr = useMemo<[number, number]>(
    () => (isMobile ? [1, 1] : [1, 1.25]),
    [isMobile],
  )

  const frameloop = !isVisible || reducedMotion ? 'demand' : 'always'

  return (
    <Canvas
      className="hero-orb__canvas"
      frameloop={frameloop}
      dpr={dpr}
      gl={{
        alpha: true,
        // MSAA is costly on 128MB dedicated VRAM; rely on modest DPR instead
        antialias: false,
        powerPreference: 'default',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0.15, 0.12, 3.7], fov: 38, near: 0.1, far: 24 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.outputColorSpace = SRGBColorSpace
        gl.domElement.style.pointerEvents = 'none'
      }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <SceneContent reducedMotion={reducedMotion} isMobile={isMobile} />
      {reducedMotion || !isVisible ? <DemandRenderKick /> : null}
    </Canvas>
  )
}

function DemandRenderKick() {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    invalidate()
    const id = window.setTimeout(() => invalidate(), 160)
    return () => window.clearTimeout(id)
  }, [invalidate])

  return null
}

export default HeroOrbScene
