import { describe, expect, it } from 'vitest'
import { clockSetup, clockStep, playClock } from './clock'
import { mulberry32, nextInt } from './rng'
import { createMission, getStormSol, missionResult, playSol, runMission, warningSolFor } from './sim'
import type { ClockMove, MissionConfig, Plan, SolPlan, Storm } from './types'

const particleStorm: Storm = {
  id: 'step-particle',
  source: 'saved',
  flareClass: 'M6.6',
  flarePeak: '2024-05-13T09:44Z',
  sepStart: '2024-05-13T12:44Z',
  gapHours: 3,
  tier: 'medium',
}

const falseAlarmStorm: Storm = {
  id: 'step-false',
  source: 'saved',
  flareClass: 'M9.8',
  flarePeak: '2023-11-28T19:50Z',
  tier: 'small',
}

describe('Stepwise Engine API', () => {
  it('matches runMission across 200 random seeded plans', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = mulberry32((seed ^ 0xabcdef) >>> 0)
      const site = seed % 2 === 0 ? 'moon' : 'mars'
      const difficulty = seed % 3 === 0 ? 'commander' : 'cadet'
      const storm = seed % 4 === 0 ? falseAlarmStorm : particleStorm
      const cfg: MissionConfig = { site, storm, seed, difficulty }

      const sols: SolPlan[] = Array.from({ length: 7 }, () => ({
        air: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        shield: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        lab: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        clock: Array.from({ length: 4 }, () =>
          rng() < 0.5 ? 'work' : 'shelter'
        ) as ClockMove[],
      }))
      const plan: Plan = { sols }

      const expected = runMission(cfg, plan)
      let state = createMission(cfg)
      for (let i = 0; i < 7; i++) {
        state = playSol(state, sols[i]).state
        if (state.done) break
      }
      const actual = missionResult(state)
      expect(actual).toEqual(expected)
    }
  })

  it('matches playClock outcome when stepping with clockStep', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const storm = seed % 3 === 0 ? falseAlarmStorm : { ...particleStorm, gapHours: 10 }
      const cfg: MissionConfig = { site: 'moon', storm, seed, difficulty: 'cadet' }
      const setup = clockSetup(cfg)

      const sequences: ClockMove[][] = [
        ['shelter'],
        ['work', 'shelter'],
        ['work', 'work', 'work', 'work'],
      ]

      for (const seq of sequences) {
        const played = playClock(setup, seq, 2, storm.tier, 0.7)
        const movesSoFar: ClockMove[] = []
        let finalStatus = clockStep(setup, movesSoFar).status

        for (const m of seq) {
          movesSoFar.push(m)
          const step = clockStep(setup, movesSoFar)
          finalStatus = step.status
          if (finalStatus !== 'continue') break
        }

        const expectedStepStatus =
          played.outcome === 'false_alarm' ? 'done' : played.outcome
        expect(finalStatus).toBe(expectedStepStatus)
      }
    }
  })

  it('computes warningSolFor accurately for Moon and Mars', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const stormSol = getStormSol(seed)
      const moonWarn = warningSolFor({
        site: 'moon',
        storm: particleStorm,
        seed,
        difficulty: 'cadet',
      })
      const marsWarn = warningSolFor({
        site: 'mars',
        storm: particleStorm,
        seed,
        difficulty: 'cadet',
      })
      expect(moonWarn).toBe(Math.max(1, stormSol - 2))
      expect(marsWarn).toBe(stormSol)
    }
  })
})
