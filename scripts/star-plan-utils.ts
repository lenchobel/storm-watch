import {
  AIR_CAP,
  AIR_TABLE,
  BOLT_COST,
  POWER_CAP,
  START_AIR,
  START_POWER,
  affordableBolts,
  calculateSunlight,
} from '../src/engine/rules'
import { getDustSol, runMission } from '../src/engine/sim'
import type { ClockMove, MissionConfig, Plan, Result } from '../src/engine/types'
import { buildPlan } from './plan-builders'

export const SOLS = 7

export interface SolB {
  air: number
  shield: number
  lab: number
}

export type Sols = SolB[]

export interface Cand {
  stars: number
  science: number
  health: number
  survived: boolean
  seed: number
  sols: Sols
  clock: ClockMove[]
  moves: number
}

export function runPlan(
  cfg: MissionConfig,
  sols: Sols,
  clock: ClockMove[],
  stormIdx: number
): Result {
  const plan: Plan = {
    sols: sols.map((s, i) => ({
      air: s.air as 0 | 1 | 2 | 3,
      shield: s.shield as 0 | 1 | 2 | 3,
      lab: s.lab as 0 | 1 | 2 | 3,
      clock: i === stormIdx ? clock : undefined,
    })),
  }
  return runMission(cfg, plan)
}

export function score(r: Pick<Cand, 'stars' | 'science' | 'health' | 'survived'>): number {
  if (!r.survived) return -1_000_000 + r.science
  return r.stars * 1_000_000 + r.science * 100 + r.health
}

/** A plan a child could actually make: every sol must fit the power budget. */
export function planValid(cfg: MissionConfig, sols: Sols): boolean {
  let power = START_POWER
  const dustSol = getDustSol(cfg.site, cfg.seed)
  for (let i = 0; i < SOLS; i++) {
    const bolts = sols[i].air + sols[i].shield + sols[i].lab
    if (bolts > affordableBolts(power)) return false
    const income = calculateSunlight(cfg.site, dustSol === i + 1)
    power = Math.min(POWER_CAP, power - bolts * BOLT_COST + income)
  }
  return true
}

export function clockOptions(K: number): ClockMove[][] {
  const opts: ClockMove[][] = []
  for (let b = 1; b <= K; b++) {
    const moves: ClockMove[] = []
    for (let i = 1; i < b; i++) moves.push('work')
    moves.push('shelter')
    opts.push(moves)
  }
  opts.push(Array(K).fill('work'))
  return opts
}

export function cloneSols(s: Sols): Sols {
  return s.map((x) => ({ ...x }))
}

/** Total bolt-count changes between two plans. One relocation counts as 2. */
export function countChanges(a: Sols, b: Sols): number {
  let diff = 0
  for (let i = 0; i < SOLS; i++) {
    diff += Math.abs(a[i].air - b[i].air)
    diff += Math.abs(a[i].shield - b[i].shield)
    diff += Math.abs(a[i].lab - b[i].lab)
  }
  return diff
}

/** The sensible plan, trimmed until it fits the power budget. */
export function sensibleBaseline(cfg: MissionConfig): Sols {
  const plan = buildPlan(cfg, 'sensible')
  const sols: Sols = plan.sols.map((s) => ({ air: s.air, shield: s.shield, lab: s.lab }))
  let guard = 0
  while (!planValid(cfg, sols) && guard++ < 200) {
    // Drop a lab bolt first, then a shield bolt, then an air bolt.
    let cut = false
    for (let i = 0; i < SOLS && !cut; i++) {
      if (sols[i].lab > 0) {
        sols[i].lab--
        cut = true
      }
    }
    if (cut) continue
    for (let i = 0; i < SOLS && !cut; i++) {
      if (sols[i].shield > 0) {
        sols[i].shield--
        cut = true
      }
    }
    if (cut) continue
    for (let i = 0; i < SOLS && !cut; i++) {
      if (sols[i].air > 1) {
        sols[i].air--
        cut = true
      }
    }
    if (!cut) break
  }
  return sols
}

const CATS: Array<keyof SolB> = ['air', 'shield', 'lab']

/** Every single bolt change: add, remove, or move between two systems. */
export function allMoves(): Array<(s: Sols) => Sols> {
  const out: Array<(s: Sols) => Sols> = []
  for (let i = 0; i < SOLS; i++) {
    for (const cat of CATS) {
      for (const sign of [1, -1]) {
        out.push((base: Sols) => {
          const next = cloneSols(base)
          next[i][cat] += sign
          return next
        })
      }
      for (const other of CATS) {
        if (other === cat) continue
        for (const sign of [1, -1]) {
          out.push((base: Sols) => {
            const next = cloneSols(base)
            next[i][cat] -= sign
            next[i][other] += sign
            return next
          })
        }
      }
    }
  }
  return out
}

export function applyMove(sols: Sols, move: (s: Sols) => Sols): Sols | null {
  const next = move(sols)
  for (let i = 0; i < SOLS; i++) {
    for (const c of CATS) {
      if (next[i][c] < 0 || next[i][c] > 3) return null
    }
  }
  return next
}

export function toCand(
  res: Result,
  seed: number,
  sols: Sols,
  clock: ClockMove[],
  moves: number
): Cand {
  return {
    stars: res.stars,
    science: res.science,
    health: res.health,
    survived: res.survived,
    seed,
    sols,
    clock,
    moves,
  }
}

function pickWeighted(rng: () => number, weights: number[]): number {
  const r = rng()
  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (r < acc) return i
  }
  return weights.length - 1
}

/** A random plan that fits the power budget and tries to keep the crew alive. */
export function randomBudgetSols(rng: () => number, cfg: MissionConfig): Sols {
  const dustSol = getDustSol(cfg.site, cfg.seed)
  let power = START_POWER
  let air = START_AIR
  const sols: Sols = []
  for (let i = 0; i < SOLS; i++) {
    const maxBolts = affordableBolts(power)
    let airBolts = pickWeighted(rng, [0.05, 0.15, 0.6, 0.2])
    let shieldBolts = pickWeighted(rng, [0.4, 0.3, 0.2, 0.1])
    let labBolts = pickWeighted(rng, [0.25, 0.35, 0.28, 0.12])
    if (air <= 22) airBolts = 2
    else if (air <= 40 && airBolts < 2) airBolts = 2
    while (airBolts + shieldBolts + labBolts > maxBolts) {
      if (labBolts > 0) labBolts--
      else if (shieldBolts > 0) shieldBolts--
      else if (airBolts > 1) airBolts--
      else break
    }
    sols.push({ air: airBolts, shield: shieldBolts, lab: labBolts })
    const bolts = airBolts + shieldBolts + labBolts
    power = Math.min(
      POWER_CAP,
      power - bolts * BOLT_COST + calculateSunlight(cfg.site, dustSol === i + 1)
    )
    const change = AIR_TABLE[Math.min(AIR_TABLE.length - 1, airBolts)]
    air = Math.max(0, Math.min(AIR_CAP, air + change))
  }
  return sols
}
