import * as THREE from 'three'
import { mulberry32 } from '../../engine/rng'
import type { SceneSvgProps } from './SceneSvg'

export interface WorldState {
  update: (seconds: number) => void
}

const cssColor = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff'

function seededStars(seed: number): THREE.Points {
  const random = mulberry32((seed ^ 0x517cc1b7) >>> 0)
  const positions = new Float32Array(240)
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (random() - 0.5) * 22
    positions[i + 1] = random() * 12 - 1
    positions[i + 2] = (random() - 0.5) * 12 - 5
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: cssColor('--text'), size: 0.07 }))
}

function ground(site: SceneSvgProps['site'], seed: number): THREE.Mesh {
  const segments = 64
  const rings = 8
  const coordinates: number[] = [0, 0, 0]
  const indices: number[] = []
  const random = mulberry32(seed >>> 0)
  const craters = [{ x: -3, z: -1, radius: 1.1 }, { x: 2.8, z: 1.6, radius: 0.85 }, { x: 4, z: -2.2, radius: 0.7 }]
  const height = (x: number, z: number) => {
    const noise = Math.sin(x * 1.3 + seed) * 0.05 + Math.cos(z * 1.6 + seed) * 0.04 + (random() - 0.5) * 0.04
    const dents = craters.reduce((sum, crater) => {
      const falloff = Math.max(0, 1 - Math.hypot(x - crater.x, z - crater.z) / crater.radius)
      return sum + falloff * falloff * 0.28
    }, 0)
    return noise - dents
  }
  for (let ring = 1; ring <= rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment * Math.PI * 2 / segments
      const radius = 7 * ring / rings
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      coordinates.push(x, z, height(x, z))
    }
  }
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    indices.push(0, 1 + segment, 1 + next)
  }
  for (let ring = 1; ring < rings; ring++) {
    const inner = 1 + (ring - 1) * segments
    const outer = inner + segments
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments
      indices.push(inner + segment, outer + segment, outer + next, inner + segment, outer + next, inner + next)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const color = site === 'mars' ? cssColor('--earth') : cssColor('--moon')
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, flatShading: true, side: THREE.DoubleSide }))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -1.12
  return mesh
}

function earthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = cssColor('--air')
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = cssColor('--green')
  for (const [x, y, w, h] of [[18, 16, 24, 15], [62, 9, 20, 17], [91, 37, 22, 15], [40, 42, 16, 11]]) {
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0.35, 0, Math.PI * 2); ctx.fill()
  }
  return new THREE.CanvasTexture(canvas)
}

function addOutpost(scene: THREE.Scene, props: SceneSvgProps & { stormActive: boolean; outcome?: string }) {
  const gold = cssColor('--gold')
  const panel = cssColor('--panel')
  const air = cssColor('--air')
  scene.add(ground(props.site, props.seed))
  const mars = props.site === 'mars'
  if (mars && props.isDustSol) {
    scene.fog = new THREE.Fog(cssColor('--dust'), 8, 18)
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: cssColor('--panel-2') }))
  dome.position.y = -0.65
  scene.add(dome)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.55, 0.42, 12), new THREE.MeshStandardMaterial({ color: panel, flatShading: true }))
  base.position.y = -0.85; scene.add(base)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.08), new THREE.MeshStandardMaterial({ color: cssColor('--navy') }))
  door.position.set(0, -1.08, 1.41); scene.add(door)
  const antenna = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 6), new THREE.MeshStandardMaterial({ color: cssColor('--text') }))
  pole.position.y = 0.7; antenna.add(pole)
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 5, 0, Math.PI, 0, Math.PI), new THREE.MeshStandardMaterial({ color: gold, side: THREE.DoubleSide }))
  dish.position.set(0.03, 1.35, 0); antenna.add(dish); antenna.position.set(1.7, -0.7, 0); scene.add(antenna)
  for (const x of [-3.8, -2.8, 2.7]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), new THREE.MeshStandardMaterial({ color: cssColor('--muted') }))
    support.position.set(x, -1.05, 0); scene.add(support)
    const cell = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: air, emissive: air, emissiveIntensity: mars ? (props.isDustSol ? 0.05 : 0.12) : 0.22, flatShading: true }))
    cell.position.set(x, -0.68, 0); cell.rotation.z = -0.13; scene.add(cell)
  }
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.8, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: gold, wireframe: true, transparent: true, opacity: 0.15 + 0.28 * props.shieldLevel }))
  shell.position.y = -0.62; scene.add(shell)
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: cssColor('--red'), transparent: true, opacity: props.outcome === 'caught' ? 0.58 : 0, depthTest: false }))
  flash.position.set(0, -0.62, 1.55); scene.add(flash)
  return { antenna, flash }
}

export function createSceneWorld(scene: THREE.Scene, props: SceneSvgProps & { stormActive: boolean; outcome?: string }): WorldState {
  scene.add(new THREE.HemisphereLight(cssColor('--text'), cssColor('--dust'), 1.1))
  const stars = seededStars(props.seed)
  scene.add(stars)
  const { antenna } = addOutpost(scene, props)
  const gold = cssColor('--gold')
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8), new THREE.MeshBasicMaterial({ color: gold }))
  sun.position.set(4.6, 3.2, -2); scene.add(sun)
  const light = new THREE.DirectionalLight(gold, 2); light.position.copy(sun.position); scene.add(light)
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), new THREE.MeshBasicMaterial({ map: earthTexture() }))
  earth.position.set(-4.8, 2.8, -2); scene.add(earth)
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: gold }))
  scene.add(dot)
  const ringPositions = new Float32Array(600)
  for (let i = 0; i < 200; i++) {
    const angle = i * Math.PI * 2 / 200
    const settledRadius = props.outcome === 'caught' ? 1.2 : 2
    ringPositions[i * 3] = props.outcome ? Math.cos(angle) * settledRadius : 4.4 + Math.cos(angle) * 0.8
    ringPositions[i * 3 + 1] = props.outcome ? -0.6 + Math.sin(angle) * settledRadius : 1.8 + Math.sin(angle) * 0.8
    ringPositions[i * 3 + 2] = props.outcome ? 1.55 + Math.sin(angle) * 0.18 : Math.sin(angle * 2) * 0.4
  }
  const particlesGeometry = new THREE.BufferGeometry()
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3))
  const particleColor = props.outcome === 'caught' ? cssColor('--red') : gold
  const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: particleColor, size: 0.09, depthTest: !props.outcome }))
  particles.visible = props.stormActive || props.outcome === 'caught' || props.outcome === 'sheltered'
  scene.add(particles)
  return {
    update(seconds) {
      dot.position.set(-4.8 + seconds % 4 * 2.35, 2.8 - seconds % 4 * 0.82, -1.2)
      antenna.rotation.y = Math.sin(seconds) * 0.08
      if (props.stormActive) {
        const position = particlesGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < 200; i++) {
          const phase = (i / 200 + seconds * 0.12) % 1
          const angle = i * Math.PI * 2 / 200
          position.setXYZ(i, 4.4 - phase * 4.1 + Math.cos(angle) * (0.8 * (1 - phase)), 1.8 - phase * 2.2 + Math.sin(angle) * (0.8 * (1 - phase)), Math.sin(angle * 2 + seconds) * 0.25)
        }
        position.needsUpdate = true
      }
      stars.rotation.y = seconds * 0.002
    },
  }
}
