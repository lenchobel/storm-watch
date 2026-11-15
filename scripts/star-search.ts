import { clockSetup } from '../src/engine/clock'
import { mulberry32 } from '../src/engine/rng'
import { getStormSol } from '../src/engine/sim'
import type {
  ClockMove,
  Difficulty,
  MissionConfig,
  Site,
  Storm,
} from '../src/engine/types'
import {
  allMoves,
  applyMove,
  clockOptions,
  cloneSols,
  countChanges,
  planValid,
  randomBudgetSols,
  runPlan,
  score,
  sensibleBaseline,
  toCand,
  type Cand,
  type Sols,
} from './star-plan-utils'

const BEAM_WIDTH = 40

export interface RowResult {
  site: Site
  difficulty: Difficulty
  storm: Storm
  best: Cand
  near: Cand[]
}

export interface SearchOptions {
  randomPlans: number
  seedPool: number
  moveSamples: number
}

export function searchRow(
  site: Site,
  difficulty: Difficulty,
  storm: Storm,
  opts: SearchOptions
): RowResult {
  const rng = mulberry32(
    (site.length * 7919 + difficulty.length * 104729 + storm.id.length * 31) >>> 0
  )
  const movers = allMoves()
  let best: Cand | null = null

  const tryCandidate = (
    seed: number,
    sols: Sols,
    clock: ClockMove[],
    moves: number
  ): Cand | null => {
    const cfg: MissionConfig = { site, storm, seed, difficulty }
    if (!planValid(cfg, sols)) return null
    const stormIdx = getStormSol(seed) - 1
    const res = runPlan(cfg, sols, clock, stormIdx)
    const cand = toCand(res, seed, sols, clock, moves)
    if (!best || score(cand) > score(best)) best = cand
    return cand
  }

  // Phase A: broad random search over seeds and plans.
  for (let i = 0; i < opts.randomPlans; i++) {
    const seed = 1 + Math.floor(rng() * opts.seedPool)
    const cfg: MissionConfig = { site, storm, seed, difficulty }
    const K = clockSetup(cfg, getStormSol(seed)).K
    const clockOpts = clockOptions(K)
    const sols = randomBudgetSols(rng, cfg)
    tryCandidate(seed, sols, clockOpts[Math.floor(rng() * clockOpts.length)], -1)
  }

  // Phase B: hill climb from the best random candidate.
  // `getBest` reads `best` through a typed call so TypeScript does not narrow
  // it to null (it is reassigned inside the `tryCandidate` closure).
  const getBest = (): Cand | null => best
  const start = getBest()
  if (start) {
    let current: Cand = start
    for (let step = 0; step < 60; step++) {
      let improved = false
      const cfg: MissionConfig = { site, storm, seed: current.seed, difficulty }
      const stormIdx = getStormSol(current.seed) - 1
      const clockOpts = clockOptions(clockSetup(cfg, stormIdx + 1).K)
      for (const move of movers) {
        const next = applyMove(current.sols, move)
        if (!next || !planValid(cfg, next)) continue
        for (const clock of clockOpts) {
          const res = runPlan(cfg, next, clock, stormIdx)
          if (score(res) > score(current)) {
            current = toCand(res, current.seed, next, clock, countChanges(current.sols, next))
            improved = true
          }
        }
      }
      if (!improved) break
    }
    const bestSoFar = getBest()
    if (bestSoFar && score(current) > score(bestSoFar)) best = current
  }

  // Phase C: near-sensible plans, fewest bolt changes from the sensible plan.
  const near: Cand[] = []
  const bestNow = getBest()
  const seed = bestNow ? bestNow.seed : 1
  const cfg: MissionConfig = { site, storm, seed, difficulty }
  const stormIdx = getStormSol(seed) - 1
  const clockOpts = clockOptions(clockSetup(cfg, stormIdx + 1).K)
  const base = sensibleBaseline(cfg)

  const key = (s: Sols, c: ClockMove[]) =>
    `${s.map((x) => `${x.air}${x.shield}${x.lab}`).join(',')}|${c.join(',')}`

  let beam: Cand[] = []
  for (const c of clockOpts) {
    const res = runPlan(cfg, base, c, stormIdx)
    beam.push(toCand(res, seed, cloneSols(base), c, 0))
  }
  const seen = new Set<string>(beam.map((b) => key(b.sols, b.clock)))

  for (let k = 0; k <= 6; k++) {
    let bestK: Cand | null = k === 0 ? beam[0] : null
    for (const cand of beam) {
      if (!bestK || score(cand) > score(bestK)) bestK = cand
    }
    if (bestK) near.push(bestK)

    // Expand the beam with every single bolt change.
    const next: Cand[] = []
    for (const cand of beam) {
      for (const move of movers) {
        const moved = applyMove(cand.sols, move)
        if (!moved || !planValid(cfg, moved)) continue
        for (const c of clockOpts) {
          const k2 = key(moved, c)
          if (seen.has(k2)) continue
          seen.add(k2)
          const res = runPlan(cfg, moved, c, stormIdx)
          next.push(toCand(res, seed, moved, c, k + 1))
        }
      }
    }
    if (next.length === 0) break
    next.sort((a, b) => score(b) - score(a))
    beam = next.slice(0, BEAM_WIDTH)
  }

  // Random sampling at exactly k changes, as a second opinion.
  for (let k = 0; k <= 6; k++) {
    let bestK: Cand | null = null
    for (let i = 0; i < opts.moveSamples; i++) {
      let rand = cloneSols(base)
      for (let m = 0; m < k; m++) {
        const next = applyMove(rand, movers[Math.floor(rng() * movers.length)])
        if (next) rand = next
      }
      if (!planValid(cfg, rand)) continue
      const c = clockOpts[Math.floor(rng() * clockOpts.length)]
      const res = runPlan(cfg, rand, c, stormIdx)
      const cand = toCand(res, seed, rand, c, k)
      if (!bestK || score(cand) > score(bestK)) bestK = cand
    }
    if (bestK) {
      const existing = near.find((n) => n.moves === k)
      if (!existing || score(bestK) > score(existing)) near.push(bestK)
    }
  }
  near.sort((a, b) => a.moves - b.moves)

  const fallback = toCand(
    runPlan(cfg, base, clockOpts[0], stormIdx),
    seed,
    base,
    clockOpts[0],
    -1
  )
  return { site, difficulty, storm, best: getBest() ?? fallback, near }
}
