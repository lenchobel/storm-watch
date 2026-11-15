import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useI18n } from '../../i18n'
import type { SceneSvgProps } from './SceneSvg'
import { createSceneWorld } from './scene3dWorld'

interface Scene3DProps extends SceneSvgProps {
  stormActive: boolean
  outcome?: string
  onContextLost: () => void
}

export function Scene3D({ onContextLost, stormActive, outcome, ...props }: Scene3DProps) {
  const host = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      onContextLost()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.setSize(element.clientWidth, element.clientHeight)
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--navy').trim())
    const camera = new THREE.PerspectiveCamera(38, element.clientWidth / element.clientHeight, 0.1, 60)
    camera.position.set(0, 1.9, 13)
    camera.lookAt(0, 0, 0)
    const world = createSceneWorld(scene, { ...props, stormActive, outcome })
    const animate = true
    let frame = 0
    let last = 0
    const resize = new ResizeObserver(() => {
      camera.aspect = element.clientWidth / Math.max(1, element.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(element.clientWidth, element.clientHeight)
      renderer.render(scene, camera)
    })
    resize.observe(element)
    const lost = (event: Event) => { event.preventDefault(); onContextLost() }
    renderer.domElement.addEventListener('webglcontextlost', lost)
    const tick = (now: number) => {
      if (document.hidden) return
      if (now - last >= 33) {
        last = now
        const seconds = now / 1000
        world.update(seconds)
        camera.position.x = Math.sin(seconds * 0.12) * 0.18
        camera.position.y = 1.9 + Math.sin(seconds * 0.18) * 0.05
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
      }
      if (animate) frame = requestAnimationFrame(tick)
    }
    const wake = () => tick(performance.now())
    document.addEventListener('visibilitychange', wake)
    renderer.render(scene, camera)
    if (animate && !document.hidden) frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', wake)
      resize.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => {
            Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose() })
            material.dispose()
          })
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onContextLost, outcome, props.site, props.seed, props.shieldLevel, props.isDustSol, props.showSignal, props.sunPulse, props.flareGlow, props.waveActive, stormActive])

  return <div ref={host} className="scene-frame scene-3d" role="img" aria-label={t(props.site === 'moon' ? 'scene.moonAlt' : 'scene.marsAlt')} data-testid="scene-3d" />
}
