import { describe, expect, it } from 'vitest'
import { dailyMission, dayNumber } from './daily'
import type { Storm } from './types'

const storms = Array.from({ length: 8 }, (_, i) => ({
  id: `storm-${i}`, source: 'saved' as const, flareClass: 'M1.0',
  flarePeak: '2024-01-01T00:00:00Z', tier: 'small' as const,
})) as Storm[]

describe('daily mission', () => {
  it('keeps one mission stable through a local day', () => {
    const first = dailyMission(storms, new Date(2026, 10, 15, 8))
    const later = dailyMission(storms, new Date(2026, 10, 15, 22))
    expect(later).toEqual(first)
  })

  it('changes seed and alternates site on the next day', () => {
    const today = dailyMission(storms, new Date(2026, 10, 15))
    const tomorrow = dailyMission(storms, new Date(2026, 10, 16))
    expect(tomorrow.site).not.toBe(today.site)
    expect(tomorrow.seed).not.toBe(today.seed)
    expect(dayNumber(new Date(2026, 10, 16)) - dayNumber(new Date(2026, 10, 15))).toBe(1)
  })
})
