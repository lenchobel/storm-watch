import gameStorms from '../src/data/gameStorms.json'
import { goalsFor, evaluateGoals } from '../src/engine/goals'
import { clockSetup } from '../src/engine/clock'
import { mulberry32, nextInt } from '../src/engine/rng'
import { createMission, missionResult, playSol } from '../src/engine/sim'
import { BOLT_COST, TOTAL_SOLS } from '../src/engine/rules'
import type { Difficulty, GoalId, MissionConfig, Site, SolPlan, Storm } from '../src/engine/types'

const PLANS = Number(process.env.GOAL_PLANS ?? 100_000)
const storms = gameStorms.storms as Storm[]
const vectors: Array<{ air: 0 | 1 | 2 | 3; shield: 0 | 1 | 2 | 3; lab: 0 | 1 | 2 | 3 }> = []
for (let air = 0; air <= 3; air++) for (let shield = 0; shield <= 3; shield++) for (let lab = 0; lab <= 3; lab++) vectors.push({ air: air as 0|1|2|3, shield: shield as 0|1|2|3, lab: lab as 0|1|2|3 })
const choicesByBudget = Array.from({ length: 10 }, (_, budget) => vectors.filter((v) => v.air + v.shield + v.lab <= budget))

function randomResult(cfg: MissionConfig, rng: () => number) {
  let state = createMission(cfg)
  for (let sol = 1; sol <= TOTAL_SOLS && !state.done; sol++) {
    const budget = Math.min(9, Math.floor(state.power / BOLT_COST))
    const affordable = choicesByBudget[budget]
    const choice = affordable[Math.floor(rng() * affordable.length)]
    const plan: SolPlan = { ...choice }
    if (sol === state.stormSol) {
      const { K } = clockSetup(cfg, state.stormSol)
      plan.clock = Array.from({ length: K }, () => rng() < 0.45 ? 'shelter' : 'work')
    }
    state = playSol(state, plan).state
  }
  return missionResult(state)
}

const eligibleCombos = new Map<GoalId, number>()
const reachableCombos = new Map<GoalId, number>()

function checkMission(site: Site, difficulty: Difficulty, storm: Storm) {
  const offered = new Set<GoalId>()
  const reachable = new Set<GoalId>()
  for (let i = 0; i < PLANS; i++) {
    const seed = i + 1
    const cfg: MissionConfig = { site, difficulty, storm, seed }
    const rng = mulberry32((seed ^ 0x831a6bc5) >>> 0)
    const result = randomResult(cfg, rng)
    const selected = new Set(goalsFor(cfg))
    const done = evaluateGoals(cfg, result)
    for (const goal of done) {
      if (!selected.has(goal.id)) continue
      offered.add(goal.id)
      if (goal.done) reachable.add(goal.id)
    }
  }
  for (const id of offered) eligibleCombos.set(id, (eligibleCombos.get(id) ?? 0) + 1)
  for (const id of reachable) reachableCombos.set(id, (reachableCombos.get(id) ?? 0) + 1)
  return [...offered].map((id) => `${id} ${reachable.has(id) ? 'YES' : 'NO'}`).join(' | ')
}

console.log(`Plans per storm/site/difficulty: ${PLANS}`)
console.log('| Site | Difficulty | Storm | Goal reachability among offered goals |')
console.log('|---|---|---|---|')
for (const site of ['moon', 'mars'] as Site[]) for (const difficulty of ['cadet', 'commander'] as Difficulty[]) for (const storm of storms) {
  console.log(`| ${site} | ${difficulty} | ${storm.id} | ${checkMission(site, difficulty, storm)} |`)
}
console.log('')
console.log('| Goal | Reachable combinations | Eligible combinations | Reachability |')
console.log('|---|---:|---:|---:|')
for (const id of ['boldCall', 'leanMachine', 'safeHands', 'scienceSprint', 'ironCrew'] as GoalId[]) {
  const total = eligibleCombos.get(id) ?? 0
  const found = reachableCombos.get(id) ?? 0
  const pct = total === 0 ? 0 : found * 100 / total
  console.log(`| ${id} | ${found} | ${total} | ${pct.toFixed(1)}% |`)
}
