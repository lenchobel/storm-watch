import { describe, expect, it } from 'vitest'
import { evaluateGoals, goalIsDone, goalsFor } from './goals'
import { runMission } from './sim'
import type { MissionConfig, Result } from './types'

const particle = {
  id: 'particle',
  source: 'saved' as const,
  flareClass: 'M5.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'medium' as const,
}
const falseAlarm = { ...particle, id: 'false', gapHours: undefined }
const cfg: MissionConfig = {
  site: 'moon',
  storm: particle,
  seed: 42,
  difficulty: 'cadet',
}

function handResult(overrides: Partial<Result> = {}): Result {
  return {
    survived: true,
    stars: 2,
    power: 40,
    air: 80,
    health: 75,
    science: 10,
    minAir: 55,
    endedOnSol: 7,
    stormSol: 4,
    clock: {
      forecastHours: 4,
      delayMinutes: 0.02,
      visibleHours: 4,
      oldMessage: false,
      K: 3,
      A: 3,
      shelterBlock: 2,
      outcome: 'sheltered',
      scienceGained: 1,
      stormDose: 12,
      outcomeText: 'The shelter held.',
      outcomeTextKey: 'clock.outcome.sheltered',
      outcomeTextParams: { n: 12 },
    },
    log: [],
    ...overrides,
  }
}

describe('bonus goals', () => {
  it('chooses three repeatable goals from the mission seed', () => {
    const first = goalsFor(cfg)
    expect(first).toHaveLength(3)
    expect(goalsFor(cfg)).toEqual(first)
    expect(new Set(first).size).toBe(3)
  })

  it('never offers boldCall for false alarms or one-block clocks', () => {
    expect(goalsFor({ ...cfg, storm: falseAlarm })).not.toContain('boldCall')
    const oneBlock = { ...particle, gapHours: 0.5 }
    expect(goalsFor({ ...cfg, storm: oneBlock })).not.toContain('boldCall')
  })

  it('evaluates goals from a hand-built result', () => {
    const result = handResult()
    expect(goalIsDone('boldCall', cfg, result)).toBe(true)
    expect(goalIsDone('leanMachine', cfg, result)).toBe(true)
    expect(goalIsDone('safeHands', cfg, result)).toBe(true)
    expect(goalIsDone('scienceSprint', cfg, result)).toBe(true)
    expect(goalIsDone('ironCrew', cfg, result)).toBe(true)
    expect(evaluateGoals(cfg, result).every((goal) => goal.done)).toBe(true)
    expect(
      goalIsDone('boldCall', cfg, handResult({ clock: { ...result.clock!, outcome: 'caught' } }))
    ).toBe(false)
  })

  it('tracks minimum air across the full mission', () => {
    const result = runMission(cfg, {
      sols: [
        { air: 1, shield: 0, lab: 0 },
        ...Array.from({ length: 6 }, () => ({ air: 3 as const, shield: 0 as const, lab: 0 as const })),
      ],
    })
    expect(result.minAir).toBe(78)
  })
})
