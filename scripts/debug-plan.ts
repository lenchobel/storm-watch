import gameStorms from '../src/data/gameStorms.json'
import { getDustSol, getStormSol, runMission } from '../src/engine/sim'
import type { MissionConfig, Storm } from '../src/engine/types'

const storm = (gameStorms.storms as Storm[])[0]
const seed = 39
const cfg: MissionConfig = { site: 'mars', storm, seed, difficulty: 'commander' }
console.log('stormSol', getStormSol(seed), 'dustSol', getDustSol('mars', seed))

const sols = [
  { air: 1, shield: 0, lab: 2 },
  { air: 1, shield: 0, lab: 2 },
  { air: 2, shield: 2, lab: 0 },
  { air: 1, shield: 0, lab: 0 },
  { air: 1, shield: 0, lab: 0 },
  { air: 2, shield: 0, lab: 0 },
  { air: 2, shield: 0, lab: 0 },
]
const stormIdx = getStormSol(seed) - 1
const res = runMission(cfg, {
  sols: sols.map((s, i) => ({
    air: s.air as 0 | 1 | 2 | 3,
    shield: s.shield as 0 | 1 | 2 | 3,
    lab: s.lab as 0 | 1 | 2 | 3,
    clock: i === stormIdx ? (['shelter'] as const) as never : undefined,
  })),
})
console.log('stars', res.stars, 'science', res.science, 'health', res.health, 'air', res.air, 'survived', res.survived, 'endedOnSol', res.endedOnSol)
for (const line of res.log) console.log('  ', line)
