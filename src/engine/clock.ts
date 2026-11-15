import { nextInt, mulberry32 } from './rng'
import {
  FALSE_ALARM_FORECAST_HOURS_RANGE,
  HOURS_PER_BLOCK,
  MARS_DELAY_MINUTES_RANGE,
  MAX_BLOCKS,
  MOON_DELAY_MINUTES,
  SHIELD_FACTOR,
  TIER_DOSE,
  formatForecastHours,
} from './rules'
import { getStormSol } from './sim'
import type {
  ClockMove,
  ClockOutcome,
  ClockSetup,
  ClockStepResult,
  MissionConfig,
  PlayClockResult,
  TextParams,
  Tier,
} from './types'

export function clockSetup(cfg: MissionConfig, _stormSol?: number): ClockSetup {
  const hasParticles = cfg.storm.gapHours !== undefined

  let forecastHours: number
  if (hasParticles) {
    forecastHours = formatForecastHours(cfg.storm.gapHours!)
  } else {
    const rng = mulberry32((cfg.seed ^ 0xbb67ae85) >>> 0)
    forecastHours = nextInt(
      rng,
      FALSE_ALARM_FORECAST_HOURS_RANGE[0],
      FALSE_ALARM_FORECAST_HOURS_RANGE[1]
    )
  }

  let delayMinutes: number
  if (cfg.site === 'moon') {
    delayMinutes = MOON_DELAY_MINUTES
  } else {
    const rng = mulberry32((cfg.seed ^ 0x3c6ef372) >>> 0)
    delayMinutes = nextInt(
      rng,
      MARS_DELAY_MINUTES_RANGE[0],
      MARS_DELAY_MINUTES_RANGE[1]
    )
  }

  const visibleHours = forecastHours - delayMinutes / 60
  const oldMessage = visibleHours <= 0

  const K = oldMessage
    ? 1
    : Math.min(
        MAX_BLOCKS,
        Math.max(1, Math.ceil(visibleHours / HOURS_PER_BLOCK))
      )

  let A: number | null = null
  if (hasParticles) {
    const rng = mulberry32((cfg.seed ^ 0x9e3779b9) >>> 0)
    A = nextInt(rng, Math.ceil(K / 2), K)
  }

  return {
    hasParticles,
    forecastHours,
    delayMinutes,
    visibleHours,
    oldMessage,
    K,
    A,
  }
}

export function previewClock(cfg: MissionConfig): ClockSetup {
  const stormSol = getStormSol(cfg.seed)
  return clockSetup(cfg, stormSol)
}

export interface ClockOutcomeText {
  outcomeText: string
  outcomeTextKey: string
  outcomeTextParams: TextParams
}

/**
 * The player-facing result of one Storm Clock. The English text is the same
 * string the UI showed before language support existed.
 */
export function clockOutcomeText(
  setup: ClockSetup,
  outcome: ClockOutcome,
  scienceGained: number,
  stormDose: number
): ClockOutcomeText {
  if (!setup.hasParticles) {
    const lost = setup.K - scienceGained
    if (lost > 0) {
      return {
        outcomeText: `No particles came. You lost ${lost} science. That is the price of caution.`,
        outcomeTextKey: 'clock.outcome.falseAlarmLost',
        outcomeTextParams: { n: lost },
      }
    }
    return {
      outcomeText: 'No particles came. Good call.',
      outcomeTextKey: 'clock.outcome.falseAlarmGood',
      outcomeTextParams: {},
    }
  }

  if (outcome === 'caught') {
    return {
      outcomeText:
        'The shield only protects the shelter. Next time, go in sooner.',
      outcomeTextKey: 'clock.outcome.caught',
      outcomeTextParams: {},
    }
  }

  const damage = Math.round(stormDose)
  return {
    outcomeText: `The shelter held. The crew took ${damage} damage.`,
    outcomeTextKey: 'clock.outcome.sheltered',
    outcomeTextParams: { n: damage },
  }
}

export function playClock(
  setup: ClockSetup,
  moves: ClockMove[] | undefined,
  shieldBolts: number,
  tier: Tier,
  radiationMultiplier: number
): PlayClockResult {
  const log: string[] = []
  let scienceGained = 0
  let outcome: ClockOutcome = 'false_alarm'

  const effectiveMoves = moves ?? ['shelter']

  for (let b = 1; b <= setup.K; b++) {
    const move = effectiveMoves[b - 1] ?? 'work'

    if (move === 'shelter') {
      outcome = 'sheltered'
      log.push(`Block ${b}: sheltered safely.`)
      break
    }

    scienceGained += 1
    log.push(`Block ${b}: worked outside (+1 science).`)

    if (setup.hasParticles && b === setup.A) {
      outcome = 'caught'
      log.push('Particles arrived while crew was outside!')
      log.push('The shield only protects the shelter.')
      break
    }
  }

  if (outcome !== 'sheltered' && outcome !== 'caught') {
    outcome = 'false_alarm'
    log.push('No particles came.')
  }

  let stormDose = 0
  if (setup.hasParticles) {
    if (outcome === 'sheltered') {
      const shieldIndex = Math.max(0, Math.min(3, shieldBolts))
      const factor = SHIELD_FACTOR[shieldIndex]
      stormDose = TIER_DOSE[tier] * factor * radiationMultiplier
    } else if (outcome === 'caught') {
      stormDose = TIER_DOSE[tier] * 1.0 * radiationMultiplier
    }
  }

  return {
    scienceGained,
    stormDose,
    outcome,
    log,
    ...clockOutcomeText(setup, outcome, scienceGained, stormDose),
  }
}

export function clockStep(
  setup: ClockSetup,
  movesSoFar: ClockMove[]
): ClockStepResult {
  if (movesSoFar.length === 0) {
    return { status: 'continue', block: 1 }
  }

  const limit = Math.min(setup.K, movesSoFar.length)
  for (let i = 0; i < limit; i++) {
    const b = i + 1
    const move = movesSoFar[i]
    if (move === 'shelter') {
      return { status: 'sheltered', block: b }
    }
    if (setup.hasParticles && b === setup.A) {
      return { status: 'caught', block: b }
    }
    if (b === setup.K) {
      return { status: 'done', block: b }
    }
  }

  return { status: 'continue', block: limit + 1 }
}


