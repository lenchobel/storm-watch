import type { Difficulty, Site, Tier } from './types'

export const START_POWER = 100
export const START_AIR = 100
export const START_HEALTH = 100
export const START_SCIENCE = 0

export const POWER_CAP = 100
export const AIR_CAP = 100
export const HEALTH_CAP = 100

export const TOTAL_SOLS = 7
export const BOLT_COST = 15
export const MAX_BOLTS_PER_SYSTEM = 3

export const SUNLIGHT_MOON = 42
export const SUNLIGHT_MARS = 24
export const MARS_DUST_FACTOR = 0.3

export const STORM_SOL_MIN = 3
export const STORM_SOL_MAX = 6

export const MARS_DUST_MIN = 2
export const MARS_DUST_MAX = 6

export const AIR_TABLE = [-42, -22, 0, 8] as const
export const SCIENCE_PER_LAB_BOLT = 1

export const COSMIC_BASE = 4
export const COSMIC_SHIELD_COEFF = 0.05

export const TIER_DOSE = {
  small: 12,
  medium: 40,
  big: 120,
} as const

export const SHIELD_FACTOR = [1, 0.6, 0.3, 0.08] as const

export const CADET_RADIATION_FACTOR = 0.7
export const COMMANDER_RADIATION_FACTOR = 1.0

export const STAR_SCIENCE_THRESHOLD_MOON = 8
export const STAR_SCIENCE_THRESHOLD_MARS = 3
export const STAR_HEALTH_THRESHOLD = 50

export const FALSE_ALARM_FORECAST_HOURS_RANGE = [2, 6] as const
export const ARRIVAL_U_RANGE = [0.5, 1.0] as const
export const MARS_DELAY_MINUTES_RANGE = [3, 22] as const
export const MOON_DELAY_MINUTES = 0.02
export const MAX_BLOCKS = 4
export const HOURS_PER_BLOCK = 2

export function formatForecastHours(gapHours: number): number {
  const clamped = Math.max(0.05, gapHours)
  if (clamped < 0.1) {
    return clamped
  }
  return Math.round(clamped * 10) / 10
}

export function affordableBolts(power: number): number {
  return Math.floor(power / BOLT_COST)
}

/**
 * Calculates bolts affordable given current power.
 * Cuts lab first, then shield, then air.
 */
export function allocateBolts(
  power: number,
  requested: { air: number; shield: number; lab: number }
): {
  allocated: { air: number; shield: number; lab: number }
  wasCut: boolean
} {
  const maxBolts = affordableBolts(power)
  let air = Math.max(0, Math.min(MAX_BOLTS_PER_SYSTEM, requested.air))
  let shield = Math.max(0, Math.min(MAX_BOLTS_PER_SYSTEM, requested.shield))
  let lab = Math.max(0, Math.min(MAX_BOLTS_PER_SYSTEM, requested.lab))

  const requestedTotal = air + shield + lab
  if (requestedTotal <= maxBolts) {
    return { allocated: { air, shield, lab }, wasCut: false }
  }

  let excess = requestedTotal - maxBolts

  // Cut from lab first
  const cutLab = Math.min(lab, excess)
  lab -= cutLab
  excess -= cutLab

  // Then cut from shield
  if (excess > 0) {
    const cutShield = Math.min(shield, excess)
    shield -= cutShield
    excess -= cutShield
  }

  // Then cut from air
  if (excess > 0) {
    const cutAir = Math.min(air, excess)
    air -= cutAir
    excess -= cutAir
  }

  return { allocated: { air, shield, lab }, wasCut: true }
}

export function calculateSunlight(site: Site, isDustSol: boolean): number {
  if (site === 'moon') {
    return SUNLIGHT_MOON
  }
  return isDustSol ? Math.floor(SUNLIGHT_MARS * MARS_DUST_FACTOR) : SUNLIGHT_MARS
}

export function calculateAirChange(airBolts: number): number {
  const index = Math.max(0, Math.min(AIR_TABLE.length - 1, airBolts))
  return AIR_TABLE[index]
}

export function calculateCosmicLoss(shieldBolts: number): number {
  const clamped = Math.max(0, Math.min(MAX_BOLTS_PER_SYSTEM, shieldBolts))
  return COSMIC_BASE * (1 - COSMIC_SHIELD_COEFF * clamped)
}

export function calculateStormDose(tier: Tier, shieldBolts: number): number {
  const clamped = Math.max(0, Math.min(SHIELD_FACTOR.length - 1, shieldBolts))
  return TIER_DOSE[tier] * SHIELD_FACTOR[clamped]
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return difficulty === 'cadet' ? CADET_RADIATION_FACTOR : COMMANDER_RADIATION_FACTOR
}

/**
 * Science needed for two stars. Mars is power-poor, so it needs fewer points.
 */
export function starScienceGoal(site: Site): number {
  return site === 'mars' ? STAR_SCIENCE_THRESHOLD_MARS : STAR_SCIENCE_THRESHOLD_MOON
}

export function calculateStars(
  survived: boolean,
  science: number,
  health: number,
  site: Site
): 0 | 1 | 2 | 3 {
  if (!survived) return 0
  const goal = starScienceGoal(site)
  if (science >= goal && health >= STAR_HEALTH_THRESHOLD) return 3
  if (science >= goal) return 2
  return 1
}







