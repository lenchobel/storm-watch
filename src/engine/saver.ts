import { clockSetup } from './clock'
import { runMission } from './sim'
import { buildSaverLine } from './saverText'
import type { Edit } from './saverText'
import type { MissionConfig, Plan, Result, SolPlan, TextParams } from './types'

export { buildSaverLine, buildSaverText } from './saverText'
export type { Edit, SaverLine } from './saverText'

export interface Saver {
  edits: Edit[]
  cost: number
  text: string
  textKey: string
  textParams: TextParams
  before: Result
  after: Result
}

interface Candidate {
  edits: Edit[]
  cost: number
  after: Result
  boltsMoved: number
  earliestSol: number
  catOrder: number
}

function applyEditsToPlan(
  plan: Plan,
  edits: Edit[],
  stormSol: number,
  K: number
): Plan {
  const sols: SolPlan[] = plan.sols.map((s) => ({
    ...s,
    clock: s.clock ? [...s.clock] : undefined,
  }))

  for (const edit of edits) {
    if (edit.kind === 'bolt') {
      const idx = edit.sol - 1
      if (sols[idx]) {
        const nextVal = (sols[idx][edit.cat] + edit.delta) as 0 | 1 | 2 | 3
        sols[idx] = { ...sols[idx], [edit.cat]: nextVal }
      }
    } else {
      const sIdx = stormSol - 1
      if (sols[sIdx]) {
        if (edit.block === 'none') {
          sols[sIdx] = { ...sols[sIdx], clock: Array(K).fill('work') }
        } else {
          const moves: Array<'work' | 'shelter'> = []
          for (let b = 1; b < edit.block; b++) moves.push('work')
          moves.push('shelter')
          sols[sIdx] = { ...sols[sIdx], clock: moves }
        }
      }
    }
  }

  return { ...plan, sols }
}

function reachesGoal(before: Result, after: Result): boolean {
  if (!before.survived) {
    return after.survived
  }
  return after.survived && after.stars > before.stars
}

function isBetter(a: Candidate, b: Candidate, before: Result): boolean {
  if (!before.survived && a.after.survived !== b.after.survived) {
    return a.after.survived
  }
  const starsA = a.after.stars - before.stars
  const starsB = b.after.stars - before.stars
  if (starsA !== starsB) return starsA > starsB
  if (a.cost !== b.cost) return a.cost < b.cost
  if (a.boltsMoved !== b.boltsMoved) return a.boltsMoved < b.boltsMoved
  if (a.earliestSol !== b.earliestSol) return a.earliestSol < b.earliestSol
  return a.catOrder < b.catOrder
}

export function findSaver(
  cfg: MissionConfig,
  plan: Plan,
  result: Result
): Saver | null {
  if (result.stars >= 3) return null

  const stormSol = result.stormSol
  const K = result.clock?.K ?? clockSetup(cfg, stormSol).K

  const cats: Array<'air' | 'shield' | 'lab'> = ['air', 'shield', 'lab']
  const catOrderMap = { air: 0, shield: 1, lab: 2 }

  const singleEdits: Edit[] = []
  for (let sol = 1; sol <= 7; sol++) {
    const solPlan = plan.sols[sol - 1] ?? { air: 0, shield: 0, lab: 0 }
    for (const cat of cats) {
      const cur = solPlan[cat] ?? 0
      if (cur + 1 <= 3) singleEdits.push({ kind: 'bolt', sol, cat, delta: 1 })
      if (cur - 1 >= 0) singleEdits.push({ kind: 'bolt', sol, cat, delta: -1 })
    }
  }

  for (let b = 1; b <= K; b++) {
    singleEdits.push({ kind: 'clock', block: b })
  }
  singleEdits.push({ kind: 'clock', block: 'none' })

  const evaluate = (edits: Edit[]): Candidate | null => {
    const editedPlan = applyEditsToPlan(plan, edits, stormSol, K)
    const after = runMission(cfg, editedPlan)
    if (!reachesGoal(result, after)) return null

    let boltsMoved = 0
    let earliestSol = 8
    let catOrder = 3

    for (const e of edits) {
      if (e.kind === 'bolt') {
        boltsMoved += 1
        earliestSol = Math.min(earliestSol, e.sol)
        catOrder = Math.min(catOrder, catOrderMap[e.cat])
      } else {
        earliestSol = Math.min(earliestSol, stormSol)
        catOrder = Math.min(catOrder, 1)
      }
    }

    return { edits, cost: edits.length, after, boltsMoved, earliestSol, catOrder }
  }

  let best: Candidate | null = null

  // 1. Single edits
  for (const edit of singleEdits) {
    const candidate = evaluate([edit])
    if (candidate) {
      if (!best || isBetter(candidate, best, result)) {
        best = candidate
      }
    }
  }

  // 2. Pairs of edits if no single edit helped
  if (!best) {
    for (let i = 0; i < singleEdits.length; i++) {
      for (let j = i + 1; j < singleEdits.length; j++) {
        const e1 = singleEdits[i]
        const e2 = singleEdits[j]
        if (e1.kind === 'bolt' && e2.kind === 'bolt' && e1.sol === e2.sol && e1.cat === e2.cat) {
          continue
        }
        if (e1.kind === 'clock' && e2.kind === 'clock') {
          continue
        }

        const candidate = evaluate([e1, e2])
        if (candidate) {
          if (!best || isBetter(candidate, best, result)) {
            best = candidate
          }
        }
      }
    }
  }

  if (!best) return null

  // Verify by re-running
  const finalPlan = applyEditsToPlan(plan, best.edits, stormSol, K)
  const verified = runMission(cfg, finalPlan)
  if (JSON.stringify(verified) !== JSON.stringify(best.after)) {
    return null
  }

  const line = buildSaverLine(best.edits, result, verified)
  return {
    edits: best.edits,
    cost: best.cost,
    text: line.text,
    textKey: line.textKey,
    textParams: line.textParams,
    before: result,
    after: verified,
  }
}

