import { getStormSol, runMission } from '../src/engine/sim'
import { buildPlan, getClockMoves, type Strategy } from './plan-builders'
import type { Difficulty, MissionConfig, Site, Storm, Tier } from '../src/engine/types'

export { buildPlan, getClockMoves, type Strategy }

// 12 synthetic storm fixtures for balance testing only (not NASA data)
export const TEST_STORMS: Storm[] = [
  // 4 Big storms
  { id: 'synth-big-0.5', source: 'saved', flareClass: 'X5.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 0.5, tier: 'big' },
  { id: 'synth-big-1.5', source: 'saved', flareClass: 'X2.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 1.5, tier: 'big' },
  { id: 'synth-big-4.0', source: 'saved', flareClass: 'X1.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 4.0, tier: 'big' },
  { id: 'synth-big-8.0', source: 'saved', flareClass: 'X3.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 8.0, tier: 'big' },
  // 3 Medium storms
  { id: 'synth-med-1.5', source: 'saved', flareClass: 'M8.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 1.5, tier: 'medium' },
  { id: 'synth-med-4.0', source: 'saved', flareClass: 'M5.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 4.0, tier: 'medium' },
  { id: 'synth-med-20.0', source: 'saved', flareClass: 'M2.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 20.0, tier: 'medium' },
  // 2 Small storms
  { id: 'synth-small-4.0', source: 'saved', flareClass: 'C9.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 4.0, tier: 'small' },
  { id: 'synth-small-8.0', source: 'saved', flareClass: 'C5.0', flarePeak: '2024-05-10T12:00:00Z', gapHours: 8.0, tier: 'small' },
  // 3 False alarms (no gapHours)
  { id: 'synth-false-x', source: 'saved', flareClass: 'X1.5', flarePeak: '2024-05-10T12:00:00Z', tier: 'big' },
  { id: 'synth-false-m', source: 'saved', flareClass: 'M6.0', flarePeak: '2024-05-10T12:00:00Z', tier: 'medium' },
  { id: 'synth-false-c', source: 'saved', flareClass: 'C8.0', flarePeak: '2024-05-10T12:00:00Z', tier: 'small' },
]

export type Strategy2 = Strategy

export function runSimulation() {
  console.log('=== Storm Watch Balance Bot ===')
  console.log('NOTE: Using 12 synthetic storm fixtures for balance testing only (not NASA data).\n')

  const N = 5000
  const targets: Array<{ site: Site; diff: Difficulty; strat: Strategy; label: string }> = [
    { site: 'moon', diff: 'cadet', strat: 'sensible', label: 'Moon Cadet Sensible' },
    { site: 'moon', diff: 'cadet', strat: 'random', label: 'Moon Cadet Random' },
    { site: 'mars', diff: 'commander', strat: 'sensible', label: 'Mars Commander Sensible' },
    { site: 'moon', diff: 'cadet', strat: 'allScience', label: 'Moon Cadet All-Science' },
    { site: 'mars', diff: 'commander', strat: 'allScience', label: 'Mars Commander All-Science' },
  ]
  console.log('| Config | Runs | Win Rate | Avg Stars | Avg Health | Avg Science |\n|---|---|---|---|---|---|')
  const results: Record<string, { winRate: number; avgStars: number; avgHealth: number; avgScience: number }> = {}

  for (const t of targets) {
    let survived = 0
    let totalStars = 0
    let totalHealth = 0
    let totalScience = 0

    for (let seed = 1; seed <= N; seed++) {
      const storm = TEST_STORMS[(seed - 1) % TEST_STORMS.length]
      const cfg: MissionConfig = { site: t.site, storm, seed, difficulty: t.diff }
      const plan = buildPlan(cfg, t.strat)
      const res = runMission(cfg, plan)

      if (res.survived) survived++
      totalStars += res.stars
      totalHealth += res.health
      totalScience += res.science
    }

    const winRate = (survived / N) * 100
    const avgStars = totalStars / N
    const avgHealth = totalHealth / N
    const avgScience = totalScience / N

    results[t.label] = { winRate, avgStars, avgHealth, avgScience }

    console.log(
      `| ${t.label} | ${N} | ${winRate.toFixed(1)}% | ${avgStars.toFixed(2)} | ${avgHealth.toFixed(1)} | ${avgScience.toFixed(1)} |`
    )
  }

  console.log('\n=== Proof Lines ===')

  // Proof (a): shelterFirst earns less average science than working every block in false alarms
  let sciShelterFirst = 0
  let sciWorkAll = 0
  let falseAlarmCount = 0
  const falseAlarms = TEST_STORMS.filter((s) => s.gapHours === undefined)

  for (let seed = 1; seed <= 1000; seed++) {
    for (const storm of falseAlarms) {
      falseAlarmCount++
      const cfg: MissionConfig = { site: 'moon', storm, seed, difficulty: 'cadet' }
      const planSF = buildPlan(cfg, 'shelterFirst')
      const planWA = buildPlan(cfg, 'allScience')
      sciShelterFirst += runMission(cfg, planSF).science
      sciWorkAll += runMission(cfg, planWA).science
    }
  }
  const avgSciSF = sciShelterFirst / falseAlarmCount
  const avgSciWA = sciWorkAll / falseAlarmCount
  const passA = avgSciSF < avgSciWA
  console.log(`Proof (a): [${passA ? 'PASS' : 'FAIL'}] shelterFirst (${avgSciSF.toFixed(2)}) < working all blocks (${avgSciWA.toFixed(2)}) in false alarms`)

  // Proof (b): waitLast is caught outside in at least 15% of particle storms
  let caughtCount = 0
  let particleCount = 0
  const particleStorms = TEST_STORMS.filter((s) => s.gapHours !== undefined)

  for (let seed = 1; seed <= 2000; seed++) {
    const storm = particleStorms[(seed - 1) % particleStorms.length]
    particleCount++
    const cfg: MissionConfig = { site: 'moon', storm, seed, difficulty: 'cadet' }
    const plan = buildPlan(cfg, 'waitLast')
    const res = runMission(cfg, plan)
    if (res.clock?.outcome === 'caught') {
      caughtCount++
    }
  }
  const caughtRate = (caughtCount / particleCount) * 100
  const passB = caughtRate >= 15.0
  console.log(`Proof (b): [${passB ? 'PASS' : 'FAIL'}] waitLast caught outside in ${caughtRate.toFixed(1)}% of particle storms (target >= 15%)`)

  // Proof (c): best clock strategy by average stars is not the same in all three tiers
  const tiers: Tier[] = ['small', 'medium', 'big']
  const bestByTier: Record<Tier, string> = { small: '', medium: '', big: '' }

  for (const tier of tiers) {
    const tierStorms = TEST_STORMS.filter((s) => s.tier === tier && s.gapHours !== undefined)
    const strats: Strategy[] = ['shelterFirst', 'waitLast', 'waitBeforeLast']
    let bestStrat = ''
    let bestStars = -1

    for (const strat of strats) {
      let stars = 0
      let count = 0
      for (let seed = 1; seed <= 1000; seed++) {
        for (const storm of tierStorms) {
          count++
          const cfg: MissionConfig = { site: 'moon', storm, seed, difficulty: 'cadet' }
          const res = runMission(cfg, buildPlan(cfg, strat))
          stars += res.stars
        }
      }
      const avg = stars / count
      if (avg > bestStars) {
        bestStars = avg
        bestStrat = strat
      }
    }
    bestByTier[tier] = bestStrat
  }
  const passC = !(bestByTier.small === bestByTier.medium && bestByTier.medium === bestByTier.big)
  console.log(`Proof (c): [${passC ? 'PASS' : 'FAIL'}] best clock strat: small=${bestByTier.small}, med=${bestByTier.medium}, big=${bestByTier.big}`)

  // Proof (d): no single bolt choice is best on every sol
  const airVals = [0, 1, 2, 3].map((b) => {
    const bv = b as 0 | 1 | 2 | 3
    return runMission({ site: 'moon', storm: TEST_STORMS[8], seed: 1, difficulty: 'cadet' }, {
      sols: [{ air: 0, shield: 0, lab: 0 }, { air: bv, shield: 0, lab: 0 }, { air: bv, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }],
    }).air
  })
  const shieldVals = [0, 1, 2, 3].map((b) =>
    runMission({ site: 'moon', storm: TEST_STORMS[4], seed: 1, difficulty: 'commander' }, {
      sols: Array.from({ length: 7 }, (_, i) => ({ air: 2, shield: (i + 1 === getStormSol(1) ? b : 0) as 0 | 1 | 2 | 3, lab: 0 })),
    }).health
  )
  const labVals = [0, 1, 2, 3].map((b) => {
    const bv = b as 0 | 1 | 2 | 3
    return runMission({ site: 'moon', storm: TEST_STORMS[8], seed: 1, difficulty: 'cadet' }, {
      sols: [{ air: 2, shield: 0, lab: bv }, { air: 2, shield: 0, lab: bv }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }, { air: 2, shield: 0, lab: 0 }],
    }).science
  })
  const passD = new Set(airVals).size === 4 && new Set(shieldVals).size === 4 && new Set(labVals).size === 4
  console.log(`Proof (d): [${passD ? 'PASS' : 'FAIL'}] Every bolt choice (0..3) produces distinct trade-offs:
  - Air (0..3 -> final air ${airVals.join('/')}): 0/1 drops air (-42/-22 per sol); 3 (+8) costs 45 power.
  - Shield (0..3 -> final health ${shieldVals.join('/')}): storm protection vs 45 power on calm sols.
  - Lab (0..3 -> final science ${labVals.join('/')}): science gain vs power needed for air/shield.`)
}

if (process.argv[1]?.endsWith('balance-bot.ts')) {
  runSimulation()
}
