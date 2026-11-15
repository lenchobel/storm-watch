import { describe, expect, it } from 'vitest'
import { clockSetup, playClock, previewClock } from './clock'
import { runMission } from './sim'
import type { MissionConfig, Plan, Storm } from './types'

const baseParticleStorm: Storm = {
  id: 'storm-particles',
  source: 'saved',
  flareClass: 'M5.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'small',
}

const baseFalseAlarm: Storm = {
  id: 'storm-false-alarm',
  source: 'saved',
  flareClass: 'X1.0',
  flarePeak: '2024-05-10T12:00:00Z',
  tier: 'big',
}

describe('Storm Clock', () => {
  // Test 1: K clamped to 1..4 for gaps of 0.5, 2, 5, 10, 40 hours (Moon)
  it('clamps K to 1..4 for gaps of 0.5, 2, 5, 10, and 40 hours on the Moon', () => {
    // Hand-computed expected values:
    // Moon delay is 0.02 min = 0.00033 hr. visibleHours = gap - 0.00033.
    // 0.5 -> K=1; 2.0 -> K=1; 5.0 -> K=3; 10.0 -> K=4; 40.0 -> K=4.
    const testCases = [
      { gap: 0.5, expectedK: 1 },
      { gap: 2.0, expectedK: 1 },
      { gap: 5.0, expectedK: 3 },
      { gap: 10.0, expectedK: 4 },
      { gap: 40.0, expectedK: 4 },
    ]
    for (const { gap, expectedK } of testCases) {
      const cfg: MissionConfig = {
        site: 'moon',
        storm: { ...baseParticleStorm, gapHours: gap },
        seed: 1,
        difficulty: 'cadet',
      }
      expect(clockSetup(cfg).K).toBe(expectedK)
    }
  })

  // Test 2: A is between 1 and K for 200 seeds, and null for false alarms
  it('ensures A is between 1 and K for 200 seeds, and null for false alarms', () => {
    // Hand-computed expected values:
    // u in [0.5, 1.0], K in [1, 4]. A = max(1, ceil(K * u)). 1 <= A <= K always.
    // For false alarm (gapHours undefined), hasParticles = false -> A = null.
    for (let seed = 1; seed <= 200; seed++) {
      const pSetup = clockSetup({
        site: 'moon',
        storm: { ...baseParticleStorm, gapHours: 5 },
        seed,
        difficulty: 'cadet',
      })
      expect(pSetup.A).not.toBeNull()
      expect(pSetup.A!).toBeGreaterThanOrEqual(1)
      expect(pSetup.A!).toBeLessThanOrEqual(pSetup.K)

      const fSetup = clockSetup({ site: 'mars', storm: baseFalseAlarm, seed, difficulty: 'cadet' })
      expect(fSetup.A).toBeNull()
    }
  })

  // Test 3: Gap 0.05 hours gives oldMessage true and K=1 on Mars, and false on Moon
  it('gives oldMessage true and K=1 on Mars, and false on Moon for gap of 0.05h', () => {
    // Hand-computed expected values:
    // Gap 0.05h = 3 min. Moon delay = 0.02 min -> visible = 0.04967 > 0 -> oldMessage = false.
    // Mars delay in [3, 22] min >= 3 min = 0.05 hr -> visible <= 0 -> oldMessage = true, K = 1.
    const moonSetup = clockSetup({
      site: 'moon',
      storm: { ...baseParticleStorm, gapHours: 0.05 },
      seed: 7,
      difficulty: 'cadet',
    })
    expect(moonSetup.oldMessage).toBe(false)

    const marsSetup = clockSetup({
      site: 'mars',
      storm: { ...baseParticleStorm, gapHours: 0.05 },
      seed: 7,
      difficulty: 'cadet',
    })
    expect(marsSetup.oldMessage).toBe(true)
    expect(marsSetup.K).toBe(1)
  })

  // Test 4: A false alarm never gives storm dose
  it('never gives storm dose for a false alarm', () => {
    // Hand-computed expected value:
    // False alarm hasParticles = false. Dose is 0 whether sheltered or working.
    const setup = clockSetup({ site: 'moon', storm: baseFalseAlarm, seed: 1, difficulty: 'commander' })
    const playSheltered = playClock(setup, ['shelter'], 0, 'big', 1.0)
    expect(playSheltered.stormDose).toBe(0)
    expect(playSheltered.outcome).toBe('sheltered')

    const playWorking = playClock(setup, ['work', 'work', 'work', 'work'], 0, 'big', 1.0)
    expect(playWorking.stormDose).toBe(0)
    expect(playWorking.outcome).toBe('false_alarm')
  })

  // Test 5: Sheltered gives tier dose * shield factor (check all 4 shield levels)
  it('gives tier dose * shield factor when sheltered across all 4 shield levels', () => {
    // Hand-computed expected values:
    // Small storm dose = 12, multiplier = 1.0. SHIELD_FACTOR = [1, 0.6, 0.3, 0.08].
    // shield 0: 12.0; shield 1: 7.2; shield 2: 3.6; shield 3: 0.96.
    const setup = clockSetup({
      site: 'moon',
      storm: { ...baseParticleStorm, tier: 'small', gapHours: 4 },
      seed: 1,
      difficulty: 'commander',
    })
    const expected = [12.0, 7.2, 3.6, 0.96]
    for (let s = 0; s <= 3; s++) {
      const res = playClock(setup, ['shelter'], s, 'small', 1.0)
      expect(res.outcome).toBe('sheltered')
      expect(res.stormDose).toBeCloseTo(expected[s])
    }
  })

  // Test 6: Caught outside gives full tier dose whatever the shield
  it('gives full tier dose when caught outside regardless of shield', () => {
    // Hand-computed expected values:
    // Big storm dose = 120. When caught on block A, dose = 120 * 1.0 = 120 for all shield levels (0..3).
    const setup = clockSetup({
      site: 'moon',
      storm: { ...baseParticleStorm, tier: 'big', gapHours: 4 },
      seed: 1,
      difficulty: 'commander',
    })
    const moves = ['work', 'work', 'work', 'work'] as const
    for (let s = 0; s <= 3; s++) {
      const res = playClock(setup, [...moves], s, 'big', 1.0)
      expect(res.outcome).toBe('caught')
      expect(res.stormDose).toBe(120)
    }
  })

  // Test 7: In false alarm, working all K blocks earns K science, sheltering on block 1 earns 0
  it('earns K science working all blocks and 0 science sheltering on block 1 in false alarm', () => {
    // Hand-computed expected value:
    // False alarm with K blocks: working all earns K science. Sheltering on block 1 earns 0.
    const setup = clockSetup({ site: 'moon', storm: baseFalseAlarm, seed: 5, difficulty: 'cadet' })
    const workAllMoves = Array.from({ length: setup.K }, () => 'work' as const)
    const resWork = playClock(setup, workAllMoves, 1, 'big', 0.7)
    expect(resWork.scienceGained).toBe(setup.K)
    expect(resWork.outcome).toBe('false_alarm')

    const resShelter = playClock(setup, ['shelter'], 1, 'big', 0.7)
    expect(resShelter.scienceGained).toBe(0)
    expect(resShelter.outcome).toBe('sheltered')
  })

  // Test 8: When caught, scienceGained equals work blocks up to and including block A
  it('awards science equal to work blocks up to and including block A when caught', () => {
    // Hand-computed expected value:
    // Player works every block until particles arrive on block A. Blocks 1..A worked -> scienceGained = A.
    const setup = clockSetup({
      site: 'moon',
      storm: { ...baseParticleStorm, gapHours: 8 },
      seed: 12,
      difficulty: 'cadet',
    })
    const workAll = ['work', 'work', 'work', 'work'] as const
    const res = playClock(setup, [...workAll], 1, 'small', 0.7)
    expect(res.outcome).toBe('caught')
    expect(res.scienceGained).toBe(setup.A!)
  })

  // Test 9: Same seed gives same clock results; changing clock moves never changes stormSol or dustSol
  it('guarantees determinism and ensures clock moves do not change stormSol or dustSol', () => {
    // Hand-computed expected value:
    // Identical seeds yield identical clock setup. Varying clock moves does not shift stormSol/dustSol.
    const cfg: MissionConfig = {
      site: 'mars',
      storm: { ...baseParticleStorm, gapHours: 4 },
      seed: 99,
      difficulty: 'cadet',
    }
    expect(clockSetup(cfg)).toEqual(clockSetup(cfg))

    const pShelter: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 0, clock: ['shelter'] })),
    }
    const pWork: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 0, clock: ['work', 'work'] })),
    }
    const resA = runMission(cfg, pShelter)
    const resB = runMission(cfg, pWork)
    expect(resA.stormSol).toBe(resB.stormSol)
    expect(resA.dustSol).toBe(resB.dustSol)
  })

  // Test 10: previewClock matches the clock used by runMission for the same cfg
  it('matches previewClock with the clock snapshot in runMission', () => {
    // Hand-computed expected value:
    // previewClock computes forecast, delay, visibleHours, oldMessage, K, A for stormSol.
    // runMission produces matching values in result.clock.
    const cfg: MissionConfig = {
      site: 'mars',
      storm: { ...baseParticleStorm, gapHours: 6 },
      seed: 42,
      difficulty: 'cadet',
    }
    const preview = previewClock(cfg)
    const plan: Plan = { sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 1, lab: 0 })) }
    const result = runMission(cfg, plan)
    expect(result.clock).toBeDefined()
    expect(result.clock!.forecastHours).toBe(preview.forecastHours)
    expect(result.clock!.delayMinutes).toBe(preview.delayMinutes)
    expect(result.clock!.visibleHours).toBe(preview.visibleHours)
    expect(result.clock!.oldMessage).toBe(preview.oldMessage)
    expect(result.clock!.K).toBe(preview.K)
    expect(result.clock!.A).toBe(preview.A)
  })
})
