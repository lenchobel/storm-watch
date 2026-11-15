import { lazy, Suspense, useCallback, useState } from 'react'
import { SceneSvg, type SceneSvgProps } from './SceneSvg'
import { SceneErrorBoundary } from './SceneErrorBoundary'

const Scene3D = lazy(() => import('./Scene3D').then((module) => ({ default: module.Scene3D })))
let webglAvailable: boolean | undefined

interface SceneViewProps extends SceneSvgProps {
  simpleView?: boolean
  stormActive?: boolean
  outcome?: string
}

function supportsWebGL(): boolean {
  if (webglAvailable !== undefined) return webglAvailable
  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl')
    webglAvailable = Boolean(context)
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglAvailable = false
  }
  return webglAvailable
}

export function SceneView({ simpleView = false, stormActive = false, outcome, ...props }: SceneViewProps) {
  const [lost, setLost] = useState(false)
  const onContextLost = useCallback(() => setLost(true), [])
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowPower = navigator.hardwareConcurrency <= 4 && memory !== undefined && memory <= 2
  const forced2D = new URLSearchParams(location.search).get('view') === '2d'
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fallback = <SceneSvg {...props} />
  if (simpleView || forced2D || reducedMotion || lowPower || lost || !supportsWebGL()) return fallback
  return (
    <SceneErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Scene3D {...props} stormActive={stormActive} outcome={outcome} onContextLost={onContextLost} />
      </Suspense>
    </SceneErrorBoundary>
  )
}
