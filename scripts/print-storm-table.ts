import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import gameStorms from '../src/data/gameStorms.json'

interface SavedStorm {
  id: string
  source: string
  flareClass: string
  flarePeak: string
  sepStart?: string
  gapHours?: number
  tier: string
}

interface Snapshot {
  fetchedAt: string
  source: string
  storms: SavedStorm[]
}

const snapshotUrl = new URL('../data/storms.json', import.meta.url)
const snapshot = JSON.parse(readFileSync(fileURLToPath(snapshotUrl), 'utf8')) as Snapshot
const byId = new Map(snapshot.storms.map((s) => [s.id, s]))
const game = gameStorms.storms as SavedStorm[]

console.log('=== Storm Watch game storms, read from data/storms.json ===')
console.log(`snapshot fetchedAt : ${snapshot.fetchedAt}`)
console.log(`snapshot source    : ${snapshot.source}`)
console.log(`snapshot storms    : ${snapshot.storms.length}`)
console.log('')
console.log('| # | id | flare class | flare peak | particle start | gap (h) | tier | in snapshot |')
console.log('|---|---|---|---|---|---|---|---|')

let missing = 0
let gapMismatch = 0
let particleCount = 0
let falseAlarmCount = 0

game.forEach((g, i) => {
  const saved = byId.get(g.id)
  if (!saved) missing++
  let gap = 'none'
  let status = saved ? 'yes' : 'NO'
  if (saved?.sepStart) {
    particleCount++
    const hours = (Date.parse(saved.sepStart) - Date.parse(saved.flarePeak)) / 3_600_000
    gap = hours.toFixed(2)
    if (Math.abs(hours - (saved.gapHours ?? -999)) > 0.01) {
      gapMismatch++
      status = 'GAP MISMATCH'
    }
  } else {
    falseAlarmCount++
  }
  console.log(
    `| ${i + 1} | ${g.id} | ${saved?.flareClass ?? 'MISSING'} | ${saved?.flarePeak ?? '-'} | ` +
      `${saved?.sepStart ?? 'none (false alarm)'} | ${gap} | ${saved?.tier ?? '-'} | ${status} |`
  )
})

console.log('')
console.log(`game storms      : ${game.length}`)
console.log(`particle storms  : ${particleCount}`)
console.log(`false alarms     : ${falseAlarmCount}`)
console.log(`missing snapshot : ${missing}`)
console.log(`gap mismatches   : ${gapMismatch}`)
console.log('')
console.log(
  gapMismatch === 0 && missing === 0
    ? 'PASS: every game storm is in the saved snapshot and every gap matches the timestamps.'
    : 'FAIL: the game set does not match the saved snapshot.'
)
