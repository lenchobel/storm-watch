import { describe, expect, it } from 'vitest'
import gameStorms from '../data/gameStorms.json'
import { compareWorlds } from './compare'
import { runMission } from './sim'
import type { ClockMove, Difficulty, MissionConfig, Plan, Storm } from './types'

const shortGapStorm: Storm = {
  id: 'compare-short',
  source: 'saved',
  flareClass: 'M2.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 2.1,
  tier: 'small',
}

describe('Compare Worlds Engine', () => {
  // Test 9: compareWorlds: K differs between Moon and Mars for short-gap storm
  it('names minutes late and missing work blocks when K differs between Moon and Mars', () => {
    // Hand-computed expected values:
    // Gap 2.1 hours.
    // Moon: visible = 2.1 - 0.00033 = 2.09967 hr -> ceil(2.09967 / 2) = 2 -> K = 2.
    // Mars: delay is in [3, 22] min. For seed 1, delay is 16 min (0.267 hr).
    // visible = 2.1 - 0.267 = 1.833 hr -> ceil(1.833 / 2) = 1 -> K = 1.
    // K differs: m = 2 - 1 = 1 block.
    // Sentence: "On Mars the warning came 16 minutes late, so you had 1 fewer work blocks."
    const moonCfg: MissionConfig = { site: 'moon', storm: shortGapStorm, seed: 1, difficulty: 'cadet' }
    const marsCfg: MissionConfig = { site: 'mars', storm: shortGapStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 0 })),
    }

    const moonRes = runMission(moonCfg, plan)
    const marsRes = runMission(marsCfg, plan)

    expect(moonRes.clock?.K).toBe(2)
    expect(marsRes.clock?.K).toBe(1)

    const comparison = compareWorlds(
      { site: 'moon', result: moonRes },
      { site: 'mars', result: marsRes }
    )

    expect(comparison.sentence).toContain('Mars')
    expect(comparison.sentence).toContain('minutes late')
    expect(comparison.sentence).toContain('1 fewer work blocks')
  })

  // Test 10: compareWorlds returns 5 rows with the right labels
  it('returns 5 rows with the expected labels and exact string values', () => {
    // Hand-computed expected values:
    // The 5 required rows: Stars, Air left, Health left, Science, Warning time.
    const cfgA: MissionConfig = { site: 'moon', storm: shortGapStorm, seed: 1, difficulty: 'cadet' }
    const cfgB: MissionConfig = { site: 'mars', storm: shortGapStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 0 })),
    }

    const resA = runMission(cfgA, plan)
    const resB = runMission(cfgB, plan)

    const { rows } = compareWorlds({ site: 'moon', result: resA }, { site: 'mars', result: resB })

    expect(rows).toHaveLength(5)
    expect(rows.map((r) => r.label)).toEqual([
      'Stars',
      'Air left',
      'Health left',
      'Science',
      'Warning time',
    ])
    expect(rows[0].a).toBe(String(resA.stars))
    expect(rows[0].b).toBe(String(resB.stars))
    expect(rows[1].a).toBe(String(resA.air))
    expect(rows[1].b).toBe(String(resB.air))
  })

  // Extra check: power sentence triggered when power differs by >= 10
  it('triggers sunlight power sentence when power differs by 10 or more without K difference', () => {
    // Hand-computed expected value:
    // When K is identical (e.g. gap = 10 -> K=4 on both Moon and Mars),
    // Moon ends with 100 power, Mars ends with much less power (difference > 10).
    // Sentence: "Mars gets less sunlight, so power ran lower."
    const storm10h: Storm = { ...shortGapStorm, gapHours: 10 }
    const moonRes = runMission({ site: 'moon', storm: storm10h, seed: 1, difficulty: 'cadet' }, {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 0, lab: 0 })),
    })
    const marsRes = runMission({ site: 'mars', storm: storm10h, seed: 1, difficulty: 'cadet' }, {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 0, lab: 0 })),
    })

    expect(moonRes.clock?.K).toBe(4)
    expect(marsRes.clock?.K).toBe(4)
    expect(Math.abs(moonRes.power - marsRes.power)).toBeGreaterThanOrEqual(10)

    const comparison = compareWorlds(
      { site: 'moon', result: moonRes },
      { site: 'mars', result: marsRes }
    )
    expect(comparison.sentence).toBe('Mars gets less sunlight, so power ran lower.')
  })

  // Test 4: Every sentence from compareWorlds across 300 seeded runs has 12 words or fewer
  it('never exceeds 12 words per sentence across 300 seeded runs', () => {
    const storms = [...(gameStorms.storms as Storm[]), shortGapStorm]
    const diffs: Difficulty[] = ['cadet', 'commander']

    for (let seed = 1; seed <= 300; seed++) {
      const storm = storms[seed % storms.length]
      const difficulty = diffs[seed % 2]
      const clock: ClockMove[] = seed % 3 === 0 ? ['work', 'work', 'shelter'] : ['shelter']
      const plan: Plan = {
        sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 1, clock })),
      }
      const moonRes = runMission({ site: 'moon', storm, seed, difficulty }, plan)
      const marsRes = runMission({ site: 'mars', storm, seed, difficulty }, plan)
      const { sentence } = compareWorlds(
        { site: 'moon', result: moonRes },
        { site: 'mars', result: marsRes }
      )
      const parts = sentence
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
      for (const part of parts) {
        expect(part.split(/\s+/).length, `Long compare sentence: "${part}"`).toBeLessThanOrEqual(12)
      }
    }
  })
})
