import { useEffect, useState } from 'react'

export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(value)
      return
    }
    const from = shown
    const start = performance.now()
    let frame = 0
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / 300)
      setShown(Math.round(from + (value - from) * progress))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{shown}</>
}
