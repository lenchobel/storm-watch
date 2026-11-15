import { describe, expect, it } from 'vitest'
import {
  allocateBolts,
  calculateCosmicLoss,
  calculateStars,
  calculateStormDose,
  starScienceGoal,
} from './rules'
import { getDustSol, getStormSol, runMission } from './sim'
import type { MissionConfig, Plan, SolPlan, Storm } from './types'

const smallStorm: Storm = {
  id: 'storm-small',
  source: 'saved',
  flareClass: 'C2.5',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'small',
}

const bigStorm: Storm = {
  id: 'storm-big',
  source: 'saved',
  flareClass: 'X5.8',
  flarePeak: '2024-05-11T01:23:00Z',
  gapHours: 4,
  tier: 'big',
}

function uniformPlan(sol: SolPlan): Plan {
  return { sols: Array.from({ length: 7 }, () => ({ ...sol })) }
}

describe('Engine Core (sim)', () => {
  // Test 1: Bolts capped by power, cuts go lab -> shield -> air
  it('caps bolts by power and cuts lab, then shield, then air', () => {
    // Hand-computed expected value:
    // Power = 50. Floor(50 / 15) = 3 bolts affordable.
    // Requested: air: 2, shield: 2, lab: 2 (total 6 bolts, excess 3).
    // Cut 2 from lab (lab -> 0, excess 1 remaining). Cut 1 from shield (shield -> 1, excess 0). Air -> 2.
    // Expected allocated: { air: 2, shield: 1, lab: 0 }.
    const { allocated, wasCut } = allocateBolts(50, { air: 2, shield: 2, lab: 2 })
    expect(wasCut).toBe(true)
    expect(allocated).toEqual({ air: 2, shield: 1, lab: 0 })
  })

  // Test 2: Power never exceeds 100
  it('never exceeds 100 power', () => {
    // Hand-computed expected value:
    // Starting power is 100. Moon sunlight is 42. Spend 0 bolts.
    // End of Sol 1 power = min(100, 100 - 0 + 42) = 100.
    const cfg: MissionConfig = { site: 'moon', storm: smallStorm, seed: 1, difficulty: 'cadet' }
    const result = runMission(cfg, uniformPlan({ air: 0, shield: 0, lab: 0 }))
    expect(result.power).toBe(100)
  })

  // Test 3: Air changes match AIR_TABLE
  it('matches AIR_TABLE for air changes', () => {
    // Hand-computed expected value:
    // Start air = 100. AIR_TABLE = [-42, -22, 0, 8].
    // Sol 1 (air 0): 100 - 42 = 58; Sol 2 (air 1): 58 - 22 = 36; Sol 3 (air 2): 36 + 0 = 36.
    // Sols 4..7 (air 3): 36 + 8*4 = 68.
    const cfg: MissionConfig = { site: 'moon', storm: smallStorm, seed: 1, difficulty: 'cadet' }
    const plan: Plan = {
      sols: [
        { air: 0, shield: 0, lab: 0 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 3, shield: 0, lab: 0 },
        { air: 3, shield: 0, lab: 0 },
        { air: 3, shield: 0, lab: 0 },
        { air: 3, shield: 0, lab: 0 },
      ],
    }
    const result = runMission(cfg, plan)
    expect(result.air).toBe(68)
    expect(result.survived).toBe(true)
  })

  // Test 4: Shield changes storm damage a lot but cosmic damage only slightly
  it('shield changes storm damage significantly but cosmic damage slightly', () => {
    // Hand-computed expected values:
    // 1. Cosmic damage rule: 4 * (1 - 0.05 * shieldBolts).
    //    Shield 0: 4.0; Shield 3: 3.4; Difference = 0.6 (only 15% reduction).
    const cosmic0 = calculateCosmicLoss(0)
    const cosmic3 = calculateCosmicLoss(3)
    expect(cosmic0).toBe(4.0)
    expect(cosmic3).toBe(3.4)
    expect(cosmic0 - cosmic3).toBeCloseTo(0.6)

    // 2. Storm damage rule (big storm tier dose = 120):
    //    Shield 0: 120 * 1 = 120; Shield 3: 120 * 0.08 = 9.6; Difference = 110.4 (92% reduction).
    const storm0 = calculateStormDose('big', 0)
    const storm3 = calculateStormDose('big', 3)
    expect(storm0).toBe(120)
    expect(storm3).toBe(9.6)
    expect(storm0 - storm3).toBeCloseTo(110.4)

    // 3. Full mission verification with Commander difficulty (medium storm dose = 40):
    //    Seed 1: stormSol is 4. Run Zero ending health = 100 - 7*4 - 40 = 32.
    //    Run ShieldedStorm (shield 3 on Sol 4): Sols 1..3: 88; Sol 4: 88 - (3.4 + 3.2) -> 81; Sols 5..7: 69.
    const medStorm: Storm = { ...bigStorm, tier: 'medium' }
    const cfg: MissionConfig = { site: 'moon', storm: medStorm, seed: 1, difficulty: 'commander' }
    const stormSol = getStormSol(cfg.seed) // sol 4
    const planZero = uniformPlan({ air: 2, shield: 0, lab: 0 })
    const planShielded: Plan = {
      sols: Array.from({ length: 7 }, (_, i) =>
        i + 1 === stormSol ? { air: 2, shield: 3, lab: 0 } : { air: 2, shield: 0, lab: 0 }
      ),
    }
    const resZero = runMission(cfg, planZero)
    const resShielded = runMission(cfg, planShielded)
    expect(resZero.health).toBe(32)
    expect(resShielded.health).toBe(69)
    expect(resShielded.health - resZero.health).toBe(37)
  })

  // Test 5: Storm sol is between 3 and 6; dust sol is between 2 and 6 and only on Mars
  it('places storm sol in [3, 6] and dust sol in [2, 6] only on Mars', () => {
    // Hand-computed expected values:
    // For all 50 seeds tested: stormSol in [3, 6]; moon dustSol is null; mars dustSol in [2, 6].
    for (let seed = 1; seed <= 50; seed++) {
      const stormSol = getStormSol(seed)
      expect(stormSol).toBeGreaterThanOrEqual(3)
      expect(stormSol).toBeLessThanOrEqual(6)
      expect(getDustSol('moon', seed)).toBeNull()
      const marsDust = getDustSol('mars', seed)
      expect(marsDust).not.toBeNull()
      expect(marsDust!).toBeGreaterThanOrEqual(2)
      expect(marsDust!).toBeLessThanOrEqual(6)
    }
  })

  // Test 6: Same seed and plan give same result; different seed can give different storm sol
  it('ensures determinism for same seed and variation for different seeds', () => {
    // Hand-computed expected value:
    // Running runMission twice with identical seed 42 produces identical result.
    const cfgA: MissionConfig = { site: 'moon', storm: smallStorm, seed: 42, difficulty: 'cadet' }
    const plan = uniformPlan({ air: 2, shield: 1, lab: 1 })
    expect(runMission(cfgA, plan)).toEqual(runMission(cfgA, plan))

    const stormSolSeed1 = getStormSol(1)
    let differentFound = false
    for (let s = 2; s < 20; s++) {
      if (getStormSol(s) !== stormSolSeed1) {
        differentFound = true
        break
      }
    }
    expect(differentFound).toBe(true)
  })

  // Test 7: Star rules: build one plan for each of 0, 1, 2 and 3 stars
  it('awards 0, 1, 2, and 3 stars according to rules', () => {
    const base: MissionConfig = { site: 'moon', storm: smallStorm, seed: 10, difficulty: 'cadet' }

    // 0 Stars: Air 0 every sol -> fails on Sol 6. Hand-computed: survived = false, stars = 0.
    const res0 = runMission(base, uniformPlan({ air: 0, shield: 0, lab: 0 }))
    expect(res0.survived).toBe(false)
    expect(res0.stars).toBe(0)

    // 1 Star: Air 2, lab 0 -> survived = true, science = 0. Hand-computed: stars = 1.
    const res1 = runMission(base, uniformPlan({ air: 2, shield: 0, lab: 0 }))
    expect(res1.survived).toBe(true)
    expect(res1.science).toBe(0)
    expect(res1.stars).toBe(1)

    // 2 Stars: Medium storm (dose 40), commander (diff 1.0), shield 0 -> health = 32 (< 50).
    // Sols 1 & 2: air 1, lab 3; Sol 3: air 2, lab 2; Sols 4..7: air 2, lab 0. Science = 8.
    // Hand-computed: survived = true, science = 8, health = 32 (< 50) -> stars = 2.
    const medStorm: Storm = { ...bigStorm, tier: 'medium' }
    const cfg2: MissionConfig = { site: 'moon', storm: medStorm, seed: 1, difficulty: 'commander' }
    const plan2: Plan = {
      sols: [
        { air: 1, shield: 0, lab: 3 },
        { air: 1, shield: 0, lab: 3 },
        { air: 2, shield: 0, lab: 2 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
      ],
    }
    const res2 = runMission(cfg2, plan2)
    expect(res2.survived).toBe(true)
    expect(res2.science).toBe(8)
    expect(res2.health).toBe(32)
    expect(res2.stars).toBe(2)

    // 3 Stars: Small storm, cadet (diff 0.7), shield 1, science = 8, health >= 50.
    // Hand-computed: survived = true, science = 8, health >= 50 -> stars = 3.
    const cfg3: MissionConfig = { site: 'moon', storm: smallStorm, seed: 1, difficulty: 'cadet' }
    const plan3: Plan = {
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
    const res3 = runMission(cfg3, plan3)
    expect(res3.survived).toBe(true)
    expect(res3.science).toBe(8)
    expect(res3.health).toBeGreaterThanOrEqual(50)
    expect(res3.stars).toBe(3)
  })

  // Test 8: Cadet takes less radiation damage than commander
  it('cadet takes less radiation damage than commander', () => {
    // Hand-computed expected value:
    // Medium storm (dose 40), 0 shield: Commander damage = 68 -> health = 32.
    // Cadet multiplies radiation by 0.7 -> health = 51.
    const medStorm: Storm = { ...bigStorm, tier: 'medium' }
    const plan = uniformPlan({ air: 2, shield: 0, lab: 0 })
    const cadetRes = runMission({ site: 'moon', storm: medStorm, seed: 1, difficulty: 'cadet' }, plan)
    const commRes = runMission({ site: 'moon', storm: medStorm, seed: 1, difficulty: 'commander' }, plan)
    expect(cadetRes.health).toBeGreaterThan(commRes.health)
    expect(commRes.health).toBe(32)
  })

  // Test 9: The mission ends early when air reaches 0
  it('ends mission early when air reaches 0', () => {
    // Hand-computed expected value:
    // Air 0: -42 each sol. Sols: 100 -> 58 -> 16 -> 0 (sol 3).
    // Fails on Sol 3: endedOnSol = 3, air = 0, survived = false.
    const cfg: MissionConfig = { site: 'moon', storm: smallStorm, seed: 1, difficulty: 'cadet' }
    const result = runMission(cfg, uniformPlan({ air: 0, shield: 0, lab: 0 }))
    expect(result.survived).toBe(false)
    expect(result.air).toBe(0)
    expect(result.endedOnSol).toBe(3)
  })

  // Test 10: The two-star science goal is lower on Mars
  it('uses a lower science goal for two stars on Mars', () => {
    // Hand-computed expected values:
    // Mars has less sunlight, so two stars need 3 science there instead of 8.
    expect(starScienceGoal('moon')).toBe(8)
    expect(starScienceGoal('mars')).toBe(3)
    expect(calculateStars(true, 2, 90, 'moon')).toBe(1)
    expect(calculateStars(true, 2, 90, 'mars')).toBe(1)
    expect(calculateStars(true, 8, 90, 'moon')).toBe(3)
    expect(calculateStars(true, 3, 90, 'mars')).toBe(3)
    expect(calculateStars(true, 3, 49, 'mars')).toBe(2)
    expect(calculateStars(false, 8, 90, 'moon')).toBe(0)
  })
})
