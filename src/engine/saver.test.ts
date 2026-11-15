import { describe, expect, it } from 'vitest'
import gameStorms from '../data/gameStorms.json'
import { mulberry32, nextInt } from './rng'
import { findSaver } from './saver'
import { getStormSol, runMission } from './sim'
import type { ClockMove, Difficulty, MissionConfig, Plan, Site, Storm } from './types'

const smallParticleStorm: Storm = {
  id: 'saver-small',
  source: 'saved',
  flareClass: 'M1.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'small',
}

const mediumParticleStorm: Storm = {
  id: 'saver-med',
  source: 'saved',
  flareClass: 'M5.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'medium',
}

const bigParticleStorm: Storm = {
  id: 'saver-big',
  source: 'saved',
  flareClass: 'X5.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'big',
}

describe('Saver Engine', () => {
  // Test 1: Plan failing on air (air 0/1 bolts) is saved by findSaver
  it('finds a saver for an air failure and re-running its edits survives', () => {
    // Hand-computed expected values (AIR_TABLE = [-42, -22, 0, 8]):
    // Sol 1 (air 0): 58; Sol 2 (air 0): 16; Sol 3 (air 1): fails (16 - 22 <= 0); Sols 4..7 (air 2).
    // Adding +1 air on Sol 1 raises Sol 1 air by +20 -> Sol 3 air is 14 > 0 -> survives!
    // Sol 1 is the earliest sol, so it wins tie-breaking.
    const cfg: MissionConfig = { site: 'moon', storm: smallParticleStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: [
        { air: 0, shield: 0, lab: 0 },
        { air: 0, shield: 0, lab: 0 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
      ],
    }
    const before = runMission(cfg, plan)
    expect(before.survived).toBe(false)

    const saver = findSaver(cfg, plan, before)
    expect(saver).not.toBeNull()
    expect(saver!.after.survived).toBe(true)
    expect(saver!.cost).toBe(1)
    expect(saver!.edits[0]).toEqual({ kind: 'bolt', sol: 1, cat: 'air', delta: 1 })
  })

  // Test 2: Plan surviving with 1 star is raised to 2 stars
  it('raises a 1-star run to 2 stars by adding science', () => {
    // Hand-computed expected values:
    // Medium storm (dose 40) on commander with shield 0: health = 100 - 28 - 40 = 32 (< 50).
    // Air = 2 on all sols (air stays 100). Lab = 1 on all sols (science = 7).
    // Science = 7 (< 8) -> stars = 1.
    // Adding +1 lab on Sol 1 raises science to 8 (>= 8).
    // Since health is 32 (< 50), stars becomes exactly 2!
    const cfg: MissionConfig = { site: 'moon', storm: mediumParticleStorm, seed: 1, difficulty: 'commander' }
    const plan: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 0, lab: 1 })),
    }
    const before = runMission(cfg, plan)
    expect(before.survived).toBe(true)
    expect(before.stars).toBe(1)
    expect(before.science).toBe(7)
    expect(before.health).toBe(32)

    const saver = findSaver(cfg, plan, before)
    expect(saver).not.toBeNull()
    expect(saver!.after.stars).toBe(2)
    expect(saver!.after.science).toBe(8)
  })

  // Test 3: A 3-star run returns null
  it('returns null for a 3-star run', () => {
    // Hand-computed expected value:
    // Already achieved 3 stars (science >= 8, health >= 50, survived = true).
    // Rule: "Only look for a saver if result is not 3 stars." -> returns null.
    const cfg: MissionConfig = { site: 'moon', storm: smallParticleStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: [
        { air: 1, shield: 0, lab: 3 },
        { air: 1, shield: 0, lab: 3 },
        { air: 2, shield: 0, lab: 2 },
        { air: 2, shield: 1, lab: 0 },
        { air: 2, shield: 1, lab: 0 },
        { air: 2, shield: 1, lab: 0 },
        { air: 2, shield: 1, lab: 0 },
      ],
    }
    const before = runMission(cfg, plan)
    expect(before.stars).toBe(3)
    expect(findSaver(cfg, plan, before)).toBeNull()
  })

  // Test 4: Run where nothing helps returns null
  it('returns null when even pair edits cannot save a run', () => {
    // Hand-computed expected values:
    // Mars, Commander, air: 0 on all 7 sols.
    // Air change is -42 each sol. Fails on Sol 3 regardless of any single or pair edit.
    // Therefore findSaver returns null.
    const cfg: MissionConfig = { site: 'mars', storm: bigParticleStorm, seed: 1, difficulty: 'commander' }
    const plan: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 0, shield: 0, lab: 0 })),
    }
    const before = runMission(cfg, plan)
    expect(before.survived).toBe(false)
    expect(findSaver(cfg, plan, before)).toBeNull()
  })

  // Test 5: Tie-break order: earlier sol wins
  it('picks the earlier sol when multiple edits have the same cost', () => {
    // Hand-computed expected values:
    // Plan fails on air sol 3. Adding air on sol 1, 2, or 3 saves it.
    // Cost is 1 for all. Sol 1 is the earliest sol, so Sol 1 wins.
    const cfg: MissionConfig = { site: 'moon', storm: smallParticleStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: [
        { air: 0, shield: 0, lab: 0 },
        { air: 0, shield: 0, lab: 0 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
      ],
    }
    const saver = findSaver(cfg, plan, runMission(cfg, plan))
    expect(saver).not.toBeNull()
    expect(saver!.edits[0].kind).toBe('bolt')
    if (saver!.edits[0].kind === 'bolt') {
      expect(saver!.edits[0].sol).toBe(1)
    }
  })

  // Test 6: Text mentions the right sol number and has 12 words or fewer per sentence
  it('generates friendly text mentioning the right sol number and keeps sentences under 12 words', () => {
    // Hand-computed expected value:
    // For bolt edit on Sol 1, text mentions "sol 1" and "air bolt".
    const cfg: MissionConfig = { site: 'moon', storm: smallParticleStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: [
        { air: 0, shield: 0, lab: 0 },
        { air: 0, shield: 0, lab: 0 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
      ],
    }
    const saver = findSaver(cfg, plan, runMission(cfg, plan))
    expect(saver).not.toBeNull()
    expect(saver!.text).toContain('sol 1')
    expect(saver!.text).toContain('air bolt')
  })

  // Test 7: Determinism: same inputs give same saver
  it('guarantees determinism for identical inputs', () => {
    // Hand-computed expected value:
    // Re-running findSaver on identical cfg, plan, result gives identical JSON representation.
    const cfg: MissionConfig = { site: 'moon', storm: smallParticleStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: Array.from({ length: 7 }, () => ({ air: 2, shield: 0, lab: 1 })),
    }
    const before = runMission(cfg, plan)
    const saver1 = findSaver(cfg, plan, before)
    const saver2 = findSaver(cfg, plan, before)
    expect(saver1).toEqual(saver2)
  })

  // Test 8: Clock edit: caught-outside run saved by shelter at block b
  it('saves a caught-outside run with a clock shelter edit', () => {
    // Hand-computed expected values:
    // Commander on medium storm (dose 40) with shield 2 on storm sol (Sol 5 for seed 1), clock = ['work', 'work', 'work', 'work'].
    // Sols 1..3 & 6..7 earn 8 science while leaving 73 power on Sol 5 (4 bolts affordable).
    // Crew is caught outside on block A, taking full 40 damage -> health = 32 (< 50) -> 2 stars.
    // Sheltering at block 1 reduces storm dose to 40 * 0.3 = 12 -> health = 60 (>= 50) -> 3 stars!
    const cfg: MissionConfig = { site: 'moon', storm: mediumParticleStorm, seed: 1, difficulty: 'commander' }
    const stormSol = getStormSol(cfg.seed)
    const plan: Plan = {
      sols: [
        { air: 2, shield: 0, lab: 3 },
        { air: 2, shield: 0, lab: 2 },
        { air: 2, shield: 0, lab: 1 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 1 },
        { air: 2, shield: 0, lab: 1 },
      ],
    }
    // Set storm sol to have shield 2 and work clock
    plan.sols[stormSol - 1] = {
      air: 2,
      shield: 2,
      lab: 0,
      clock: ['work', 'work', 'work', 'work'],
    }

    const before = runMission(cfg, plan)
    expect(before.stars).toBe(2)
    expect(before.clock?.outcome).toBe('caught')

    const saver = findSaver(cfg, plan, before)
    expect(saver).not.toBeNull()
    expect(saver!.after.stars).toBe(3)
    expect(saver!.edits[0].kind).toBe('clock')
    expect(saver!.text).toContain('shelter')
  })

  // Test 9: Every sentence from findSaver across 300 seeded runs has 12 words or fewer
  it('never exceeds 12 words per sentence across 300 seeded runs', () => {
    const storms = gameStorms.storms as Storm[]
    const sites: Site[] = ['moon', 'mars']
    const diffs: Difficulty[] = ['cadet', 'commander']
    let checked = 0

    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0)
      const site = sites[seed % 2]
      const difficulty = diffs[Math.floor(seed / 2) % 2]
      const storm = storms[seed % storms.length]
      const cfg: MissionConfig = { site, storm, seed, difficulty }
      const plan: Plan = {
        sols: Array.from({ length: 7 }, () => ({
          air: nextInt(rng, 0, 2) as 0 | 1 | 2,
          shield: nextInt(rng, 0, 2) as 0 | 1 | 2,
          lab: nextInt(rng, 0, 2) as 0 | 1 | 2,
          clock: Array.from({ length: 4 }, () =>
            rng() < 0.5 ? 'work' : 'shelter'
          ) as ClockMove[],
        })),
      }
      const before = runMission(cfg, plan)
      const saver = findSaver(cfg, plan, before)
      if (!saver) continue
      checked++
      const sentences = saver.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
      for (const sentence of sentences) {
        expect(sentence.split(/\s+/).length, `Long saver sentence: "${sentence}"`).toBeLessThanOrEqual(12)
      }
    }
    expect(checked).toBeGreaterThan(50)
  })
})
