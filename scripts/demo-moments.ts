import gameStorms from '../src/data/gameStorms.json'
import { clockSetup } from '../src/engine/clock'
import { getDustSol, getStormSol, runMission } from '../src/engine/sim'
import type { Difficulty, MissionConfig, Plan, Site, Storm } from '../src/engine/types'

const storms = gameStorms.storms as Storm[]
const target = storms.find((s) => s.id === '2024-02-06T02:37:00-FLR-001')!

function defaultPlan(difficulty: Difficulty) {
  return difficulty === 'cadet'
    ? { air: 2, shield: 1, lab: 0 }
    : { air: 2, shield: 0, lab: 0 }
}

function play(site: Site, difficulty: Difficulty, seed: number, moves: ('work' | 'shelter')[]) {
  const cfg: MissionConfig = { site, storm: target, seed, difficulty }
  const stormIdx = getStormSol(seed) - 1
  const plan: Plan = {
    sols: Array.from({ length: 7 }, (_, i) =>
      i === stormIdx ? { ...defaultPlan(difficulty), clock: moves } : defaultPlan(difficulty)
    ),
  }
  return runMission(cfg, plan)
}

console.log(`Storm ${target.id}  ${target.flareClass}  gap ${target.gapHours} h  tier ${target.tier}`)
console.log('seed | stormSol | moonA | marsDelay | marsK | marsOld | work-all | shelter-now')
for (let seed = 1; seed <= 30; seed++) {
  const moonCfg: MissionConfig = { site: 'moon', storm: target, seed, difficulty: 'cadet' }
  const marsCfg: MissionConfig = { site: 'mars', storm: target, seed, difficulty: 'cadet' }
  const moon = clockSetup(moonCfg, getStormSol(seed))
  const mars = clockSetup(marsCfg, getStormSol(seed))
  const work = play('moon', 'cadet', seed, ['work', 'work'])
  const shelter = play('moon', 'cadet', seed, ['shelter'])
  console.log(
    `${String(seed).padStart(4)} | ${String(getStormSol(seed)).padStart(8)} | ${String(moon.A).padStart(5)} | ${String(mars.delayMinutes).padStart(9)} | ${String(mars.K).padStart(5)} | ${String(mars.oldMessage).padStart(7)} | ${
      work.survived
        ? `survived hp${work.health} sci${work.science} stars${work.stars}`
        : `DIED sol${work.endedOnSol}`
    } | ${shelter.survived ? `survived hp${shelter.health} stars${shelter.stars}` : `DIED sol${shelter.endedOnSol}`}`
  )
}
