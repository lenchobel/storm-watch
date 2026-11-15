import * as THREE from 'three'
import { mulberry32 } from '../../engine/rng'
import type { SceneSvgProps } from './SceneSvg'

type WorldProps = SceneSvgProps & { stormActive: boolean; outcome?: string }

export interface WorldState {
  update: (seconds: number) => void
}

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff'

function skyTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')!
  const sky = context.createLinearGradient(0, 0, 0, canvas.height)
  sky.addColorStop(0, '#050914')
  sky.addColorStop(0.64, '#101a3a')
  sky.addColorStop(1, '#301d2d')
  context.fillStyle = sky
  context.fillRect(0, 0, canvas.width, canvas.height)
  const random = mulberry32((seed ^ 0x3c6ef372) >>> 0)
  for (let index = 0; index < 11; index += 1) {
    const x = random() * canvas.width
    const y = random() * 170
    const glow = context.createRadialGradient(x, y, 2, x, y, 38 + random() * 78)
    glow.addColorStop(0, index % 2 ? 'rgba(86,157,255,.18)' : 'rgba(248,181,77,.13)')
    glow.addColorStop(1, 'rgba(5,9,20,0)')
    context.fillStyle = glow
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function stars(seed: number, count: number, size: number, color: string) {
  const random = mulberry32(seed >>> 0)
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 28
    positions[index * 3 + 1] = random() * 13 - 1
    positions[index * 3 + 2] = -8 - random() * 18
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color, size, transparent: true, opacity: 0.8, sizeAttenuation: true,
  }))
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
  const result = new THREE.Mesh(geometry, material)
  result.position.set(x, y, z)
  return result
}

function terrain(scene: THREE.Scene, props: WorldProps) {
  const geometry = new THREE.PlaneGeometry(34, 34, 64, 64)
  const positions = geometry.attributes.position as THREE.BufferAttribute
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const z = positions.getY(index)
    positions.setZ(index, Math.sin(x * 0.74 + props.seed * 0.08) * 0.055 + Math.cos(z * 0.56) * 0.045)
  }
  geometry.computeVertexNormals()
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: css(props.site === 'mars' ? '--earth' : '--moon'), roughness: 0.93, metalness: 0.02,
  }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.22
  scene.add(ground)
  if (props.site === 'moon') {
    for (const crater of [{ x: -4.4, z: -3.1, r: 1.15 }, { x: 3.8, z: -2.7, r: 0.75 }, { x: 5.4, z: 2.1, r: 0.9 }]) {
      const ring = mesh(new THREE.RingGeometry(crater.r * 0.65, crater.r, 24), new THREE.MeshBasicMaterial({
        color: css('--navy'), transparent: true, opacity: 0.26, side: THREE.DoubleSide,
      }), crater.x, -1.195, crater.z)
      ring.rotation.x = -Math.PI / 2
      scene.add(ring)
    }
  }
}

function outpost(scene: THREE.Scene, props: WorldProps) {
  const base = new THREE.Group()
  const metal = new THREE.MeshStandardMaterial({ color: '#c8d1df', roughness: 0.42, metalness: 0.42 })
  const dark = new THREE.MeshStandardMaterial({ color: css('--panel'), roughness: 0.55, metalness: 0.24 })
  const glass = new THREE.MeshStandardMaterial({ color: css('--air'), roughness: 0.18, metalness: 0.18, transparent: true, opacity: 0.72, emissive: css('--air'), emissiveIntensity: 0.12 })
  base.add(mesh(new THREE.CylinderGeometry(1.46, 1.7, 0.32, 32), dark, 0, -1.03, 0))
  base.add(mesh(new THREE.SphereGeometry(1.42, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, -0.87, 0))
  for (const angle of [0, Math.PI / 3, (Math.PI * 2) / 3]) {
    const rib = mesh(new THREE.TorusGeometry(1.43, 0.026, 6, 28, Math.PI), metal, 0, -0.86, 0)
    rib.rotation.y = angle
    base.add(rib)
  }
  const tunnel = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.78, 16), metal, 0, -0.88, 1.4)
  tunnel.rotation.x = Math.PI / 2
  base.add(tunnel, mesh(new THREE.BoxGeometry(0.42, 0.52, 0.05), dark, 0, -0.88, 1.82))
  for (const x of [-3.5, -2.25, 2.5]) {
    const stand = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.64, 6), metal, x, -0.94, 0.15)
    const panel = mesh(new THREE.BoxGeometry(1.15, 0.045, 0.62), new THREE.MeshStandardMaterial({
      color: '#123767', roughness: 0.28, metalness: 0.55, emissive: css('--air'), emissiveIntensity: props.isDustSol ? 0.03 : 0.16,
    }), x, -0.63, 0.15)
    panel.rotation.z = -0.17
    base.add(stand, panel)
  }
  const antenna = new THREE.Group()
  antenna.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.22, 8), metal, 0, 0.3, 0))
  const dish = mesh(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI, 0, Math.PI / 2), metal, 0, 0.94, 0)
  dish.rotation.x = -0.45
  antenna.add(dish)
  antenna.position.set(1.88, -0.8, 0.15)
  base.add(antenna)
  const shield = mesh(new THREE.SphereGeometry(1.74, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({
    color: css('--gold'), wireframe: true, transparent: true, opacity: 0.09 + props.shieldLevel * 0.12,
  }), 0, -0.82, 0)
  base.add(shield)
  scene.add(base)
  return { antenna, shield }
}

function astronaut(scene: THREE.Scene) {
  const suit = new THREE.MeshStandardMaterial({ color: '#e8edf4', roughness: 0.52, metalness: 0.1 })
  const visor = new THREE.MeshStandardMaterial({ color: '#07111d', roughness: 0.12, metalness: 0.6, emissive: '#163d62', emissiveIntensity: 0.22 })
  const avatar = new THREE.Group()
  avatar.add(mesh(new THREE.BoxGeometry(0.35, 0.5, 0.25), suit, 0, 0.58, 0))
  avatar.add(mesh(new THREE.SphereGeometry(0.23, 16, 12), suit, 0, 0.98, 0))
  avatar.add(mesh(new THREE.SphereGeometry(0.175, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), visor, 0, 0.99, 0.16))
  for (const x of [-0.12, 0.12]) {
    avatar.add(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.38, 8), suit, x, 0.17, 0))
    avatar.add(mesh(new THREE.BoxGeometry(0.12, 0.07, 0.2), visor, x, -0.06, 0.05))
  }
  avatar.add(mesh(new THREE.BoxGeometry(0.19, 0.32, 0.12), visor, 0, 0.58, -0.18))
  avatar.position.set(-2.35, -1.15, 1.1)
  scene.add(avatar)
  return { avatar, visor }
}

export function createSceneWorld(scene: THREE.Scene, props: WorldProps): WorldState {
  scene.add(new THREE.HemisphereLight('#c9dcff', css('--dust'), 1.35))
  if (props.site === 'mars' && props.isDustSol) scene.fog = new THREE.Fog(css('--dust'), 7, 19)
  const keyLight = new THREE.DirectionalLight(css('--gold'), 1.8)
  keyLight.position.set(5, 6, 4)
  scene.add(keyLight)
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(38, 32, 18), new THREE.MeshBasicMaterial({ map: skyTexture(props.seed), side: THREE.BackSide })))
  const starLayers = [stars(props.seed, 320, 0.055, '#ffffff'), stars(props.seed ^ 0x51, 100, 0.09, css('--air'))]
  starLayers.forEach((layer) => scene.add(layer))
  terrain(scene, props)
  const { antenna, shield } = outpost(scene, props)
  const { avatar, visor } = astronaut(scene)
  const sun = new THREE.Group()
  const corona = mesh(new THREE.SphereGeometry(0.96, 24, 16), new THREE.MeshBasicMaterial({ color: css('--gold'), transparent: true, opacity: 0.09, depthWrite: false }), 0, 0, 0)
  sun.add(corona, mesh(new THREE.SphereGeometry(0.47, 24, 16), new THREE.MeshBasicMaterial({ color: css('--gold') }), 0, 0, 0))
  sun.position.set(5.1, 3.45, -3.8)
  scene.add(sun, mesh(new THREE.SphereGeometry(props.site === 'moon' ? 0.52 : 0.16, 24, 16), new THREE.MeshStandardMaterial({ color: css('--air'), roughness: 0.82 }), -5.1, 3.05, -3.8))
  const impacts = stars(props.seed ^ 0x99, 150, 0.085, props.outcome === 'caught' ? css('--red') : css('--gold'))
  impacts.visible = props.stormActive || Boolean(props.outcome)
  scene.add(impacts)
  return { update(seconds) {
    starLayers.forEach((layer, index) => {
      layer.rotation.y = seconds * (0.00045 + index * 0.00025)
      ;(layer.material as THREE.PointsMaterial).opacity = 0.58 + (Math.sin(seconds * 0.6 + index) + 1) * 0.12
    })
    antenna.rotation.y = Math.sin(seconds * 0.75) * 0.06
    sun.position.y = 3.45 + Math.sin(seconds * 0.16) * 0.08
    corona.scale.setScalar(1 + (Math.sin(seconds * 0.7) + 1) * 0.045)
    if (props.stormActive || props.outcome) {
      shield.scale.setScalar(1 + Math.sin(seconds * 2.4) * 0.025)
      const positions = impacts.geometry.attributes.position as THREE.BufferAttribute
      for (let index = 0; index < positions.count; index += 1) {
        const phase = (index / positions.count + seconds * 0.16) % 1
        if (props.outcome === 'sheltered') {
          const angle = index / positions.count * Math.PI * 2
          positions.setXYZ(index, Math.cos(angle) * 1.65, -0.76 + Math.sin(angle) * 0.92, 0.35)
        } else if (props.outcome === 'caught') {
          positions.setXYZ(index, -2.35 + Math.sin(index) * 0.36, -0.3 + Math.cos(index * 1.7) * 0.72, 0.9)
        } else {
          positions.setXYZ(index, 5.1 - phase * 5, 3.2 - phase * 3.75, -0.2 + Math.sin(index + seconds) * 0.5)
        }
      }
      positions.needsUpdate = true
      avatar.position.x = -2.35 + Math.sin(seconds * 1.2) * 0.08
    }
    if (props.outcome === 'sheltered') avatar.visible = false
    if (props.outcome === 'caught') {
      avatar.rotation.z = 0.72
      visor.emissive.set(css('--red'))
      visor.emissiveIntensity = 0.55 + Math.sin(seconds * 2) * 0.15
    }
  }}
}
