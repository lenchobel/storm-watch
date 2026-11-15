import { mulberry32, nextInt } from '../src/engine/rng'
import { getStormSol } from '../src/engine/sim'
import { clockSetup } from '../src/engine/clock'
import type { ClockMove, MissionConfig, Plan, SolPlan } from '../src/engine/types'

export type Strategy =
  | 'random'
  | 'sensible'
  | 'allScience'
  | 'shelterFirst'
  | 'waitLast'
  | 'waitBeforeLast'

export function getClockMoves(strategy: Strategy, K: number): ClockMove[] {
  if (strategy === 'shelterFirst') {
    return ['shelter']
  }
  if (strategy === 'waitLast') {
    const moves: ClockMove[] = []
    for (let i = 1; i < K; i++) moves.push('work')
    moves.push('shelter')
    return moves
  }
  if (strategy === 'allScience') {
    return Array(K).fill('work')
  }
  const shelterBlock = Math.max(1, K - 1)
  const moves: ClockMove[] = []
  for (let i = 1; i < shelterBlock; i++) moves.push('work')
  moves.push('shelter')
  return moves
}

export function buildPlan(cfg: MissionConfig, strategy: Strategy): Plan {
  const stormSol = getStormSol(cfg.seed)
  const setup = clockSetup(cfg, stormSol)
  const K = setup.K

  if (strategy === 'random') {
    const rng = mulberry32((cfg.seed ^ 0x51ed270b) >>> 0)
    return {
      sols: Array.from({ length: 7 }, () => ({
        air: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        shield: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        lab: nextInt(rng, 0, 3) as 0 | 1 | 2 | 3,
        clock: Array.from({ length: 4 }, () =>
          rng() < 0.5 ? 'work' : 'shelter'
        ) as ClockMove[],
      })),
    }
  }

  if (strategy === 'allScience') {
    return {
      sols: Array.from({ length: 7 }, () => ({
        air: 1,
        shield: 0,
        lab: 3,
        clock: Array(K).fill('work') as ClockMove[],
      })),
    }
  }

  const clockMoves = getClockMoves(strategy, K)
  const sols: SolPlan[] = Array.from({ length: 7 }, () => ({
    air: 2,
    shield: 0,
    lab: 1,
    clock: undefined,
  }))

  if (cfg.site === 'moon' && stormSol > 1) {
    sols[stormSol - 2].lab = 0
  }

  sols[stormSol - 1] = {
    air: 2,
    shield: 3,
    lab: 0,
    clock: clockMoves,
  }

  return { sols }
}
