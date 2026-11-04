import {
  Color,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  type Texture,
  type WebGLRenderer,
} from 'three'

/**
 * High-contrast studio env for glass speculars on weak integrated GPUs.
 * Uses emissive panels (not HDR files) so reflections stay sharp and gold-rimmed
 * without extra texture memory.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
  const pmrem = new PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()

  const scene = new Scene()
  scene.background = new Color('#030303')

  const materials: MeshStandardMaterial[] = []
  const shared = new PlaneGeometry(1, 1)

  const strips: Array<{
    emissive: string
    intensity: number
    position: [number, number, number]
    scale: [number, number, number]
    rotation?: [number, number, number]
  }> = [
    // Bright key softbox — clear glass speculars
    {
      emissive: '#ffffff',
      intensity: 6.5,
      position: [-2.6, 1.7, 1.4],
      scale: [1.4, 3.6, 1],
      rotation: [0, Math.PI / 3.1, 0],
    },
    // Narrow white edge highlight
    {
      emissive: '#f8f4ea',
      intensity: 8,
      position: [-1.4, 2.4, 2.2],
      scale: [0.22, 2.8, 1],
      rotation: [0.15, Math.PI / 4, 0],
    },
    // Vertical gold rim strip
    {
      emissive: '#d4af37',
      intensity: 4.2,
      position: [2.7, 0.6, 0.6],
      scale: [0.22, 4.6, 1],
      rotation: [0, -Math.PI / 3.4, 0.08],
    },
    // Warm gold kiss from below-right
    {
      emissive: '#e8d48b',
      intensity: 3.4,
      position: [2.0, -1.5, 1.8],
      scale: [2.2, 0.2, 1],
      rotation: [0.45, -0.55, 0],
    },
    // Overhead cream bar
    {
      emissive: '#f5f0e8',
      intensity: 3.8,
      position: [0.2, 3.3, 0.8],
      scale: [4.2, 0.35, 1],
      rotation: [Math.PI / 2.05, 0, 0],
    },
    // Dim rear bounce for silhouette depth (kept darker)
    {
      emissive: '#6a5420',
      intensity: 1.2,
      position: [0, 0.1, -3.1],
      scale: [3.6, 2.0, 1],
    },
    // Ground gold reflection strip
    {
      emissive: '#c9a227',
      intensity: 2.6,
      position: [0.4, -2.5, 1.0],
      scale: [3.2, 0.28, 1],
      rotation: [-Math.PI / 2.35, 0, 0],
    },
  ]

  for (const strip of strips) {
    const material = new MeshStandardMaterial({
      color: '#000000',
      emissive: strip.emissive,
      emissiveIntensity: strip.intensity,
      roughness: 1,
      metalness: 0,
    })
    materials.push(material)

    const mesh = new Mesh(shared, material)
    mesh.position.set(...strip.position)
    mesh.scale.set(...strip.scale)
    if (strip.rotation) mesh.rotation.set(...strip.rotation)
    scene.add(mesh)
  }

  // Near-zero sigma keeps specular edges sharper on low-end GPUs
  const envMap = pmrem.fromScene(scene, 0.008, 0.1, 100).texture

  for (const material of materials) material.dispose()
  shared.dispose()
  pmrem.dispose()

  return envMap
}
