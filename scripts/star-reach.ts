import gameStorms from '../src/data/gameStorms.json'
import { getStormSol, runMission } from '../src/engine/sim'
import type { Difficulty, Site, Storm } from '../src/engine/types'
import { searchRow, type RowResult } from './star-search'

const RANDOM_PLANS = Number(process.env.STAR_PLANS ?? 200_000)
const SEED_POOL = Number(process.env.STAR_SEEDS ?? 60)
const MOVE_SAMPLES = Number(process.env.STAR_SAMPLES ?? 8_000)

function describe(row: RowResult): string {
  const stormIdx = getStormSol(row.best.seed) - 1
  const solTxt = row.best.sols
    .map(
      (s, i) =>
        `${i + 1}:${s.air}/${s.shield}/${s.lab}${i === stormIdx ? '*' : ''}`
    )
    .join(' ')
  const clockTxt = row.best.clock.map((m) => (m === 'work' ? 'W' : 'S')).join('')
  return `${solTxt} clock=${clockTxt}`
}

/** Re-run the printed plan and check it reproduces the reported result. */
function verify(row: RowResult): string {
  const stormIdx = getStormSol(row.best.seed) - 1
  const res = runMission(
    { site: row.site, storm: row.storm, seed: row.best.seed, difficulty: row.difficulty },
    {
      sols: row.best.sols.map((s, i) => ({
        air: s.air as 0 | 1 | 2 | 3,
        shield: s.shield as 0 | 1 | 2 | 3,
        lab: s.lab as 0 | 1 | 2 | 3,
        clock: i === stormIdx ? row.best.clock : undefined,
      })),
    }
  )
  const ok =
    res.stars === row.best.stars && res.science === row.best.science
  return ok ? 'ok' : `MISMATCH (re-run stars ${res.stars} sci ${res.science})`
}

function main() {
  const storms = gameStorms.storms as Storm[]
  const sites: Site[] = ['moon', 'mars']
  const diffs: Difficulty[] = ['cadet', 'commander']
  const rows: RowResult[] = []

  console.log('=== Storm Watch Star Reachability ===')
  console.log(
    `Random search: ${RANDOM_PLANS} plans per row over ${SEED_POOL} seeds, plus hill climbing.`
  )
  console.log(
    'Near-sensible search: 0 to 6 bolt changes from the sensible plan (2 changes = 1 bolt moved).'
  )
  console.log('')

  for (const site of sites) {
    for (const difficulty of diffs) {
      for (const storm of storms) {
        const row = searchRow(site, difficulty, storm, {
          randomPlans: RANDOM_PLANS,
          seedPool: SEED_POOL,
          moveSamples: MOVE_SAMPLES,
        })
        rows.push(row)
        const changes2 = row.near.find((n) => n.stars >= 2)?.moves ?? -1
        const changes3 = row.near.find((n) => n.stars >= 3)?.moves ?? -1
        console.log(
          `| ${site} | ${difficulty} | ${storm.id.slice(0, 10)} | ${storm.flareClass} | ${storm.tier} | ${storm.gapHours ?? 'none'} | ${row.best.stars} | ${row.best.science} | ${row.best.health} | ${row.best.seed} | ${changes2} | ${changes3} |`
        )
      }
    }
  }

  console.log('')
  console.log(
    '| Site | Diff | Storm | Stars | Science | Health | Seed | Plan (air/shield/lab per sol, * = storm sol) | Re-run |'
  )
  console.log('|---|---|---|---|---|---|---|---|---|')
  for (const row of rows) {
    console.log(
      `| ${row.site} | ${row.difficulty} | ${row.storm.id.slice(0, 10)} | ${row.best.stars} | ${row.best.science} | ${row.best.health} | ${row.best.seed} | ${describe(row)} | ${verify(row)} |`
    )
  }

  console.log('')
  let twoStarOk = 0
  const threeStar = new Map<string, number>()
  for (const row of rows) {
    if (row.best.stars >= 2) twoStarOk++
    const key = `${row.site}/${row.difficulty}`
    if (row.best.stars >= 3) threeStar.set(key, (threeStar.get(key) ?? 0) + 1)
  }
  console.log(
    `2 stars reachable in ${twoStarOk}/${rows.length} rows (target ${rows.length}/${rows.length})`
  )
  const threeStarTarget = Math.ceil(storms.length * 2 / 3)
  for (const key of ['moon/cadet', 'moon/commander', 'mars/cadet', 'mars/commander']) {
    console.log(
      `3 stars reachable on ${threeStar.get(key) ?? 0}/${storms.length} storms for ${key} (target >= ${threeStarTarget}/${storms.length})`
    )
  }
}

main()
