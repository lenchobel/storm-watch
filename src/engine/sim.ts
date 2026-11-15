import { clockSetup, playClock } from './clock'
import { nextInt, mulberry32 } from './rng'
import {
  AIR_CAP,
  BOLT_COST,
  HEALTH_CAP,
  MARS_DUST_MAX,
  MARS_DUST_MIN,
  POWER_CAP,
  SCIENCE_PER_LAB_BOLT,
  STORM_SOL_MAX,
  STORM_SOL_MIN,
  TOTAL_SOLS,
  START_AIR,
  START_HEALTH,
  START_POWER,
  START_SCIENCE,
  allocateBolts,
  calculateAirChange,
  calculateCosmicLoss,
  calculateStars,
  calculateSunlight,
  getDifficultyMultiplier,
} from './rules'
import type {
  MissionConfig,
  MissionState,
  Plan,
  Result,
  Site,
  SolPlan,
  SolReport,
} from './types'

export function getStormSol(seed: number): number {
  const rng = mulberry32(seed)
  return nextInt(rng, STORM_SOL_MIN, STORM_SOL_MAX)
}

export function getDustSol(site: Site, seed: number): number | null {
  if (site !== 'mars') return null
  const rng = mulberry32((seed ^ 0x6a09e667) >>> 0)
  return nextInt(rng, MARS_DUST_MIN, MARS_DUST_MAX)
}

export function warningSolFor(cfg: MissionConfig): number {
  const stormSol = getStormSol(cfg.seed)
  return cfg.site === 'moon' ? Math.max(1, stormSol - 2) : stormSol
}

export function setupMission(cfg: MissionConfig): {
  stormSol: number
  dustSol: number | null
} {
  return {
    stormSol: getStormSol(cfg.seed),
    dustSol: getDustSol(cfg.site, cfg.seed),
  }
}

export function createMission(cfg: MissionConfig): MissionState {
  return {
    cfg,
    sol: 1,
    done: false,
    survived: true,
    power: START_POWER,
    air: START_AIR,
    health: START_HEALTH,
    science: START_SCIENCE,
    endedOnSol: TOTAL_SOLS,
    stormSol: getStormSol(cfg.seed),
    dustSol: getDustSol(cfg.site, cfg.seed),
    log: [],
    reports: [],
  }
}

export function playSol(
  state: MissionState,
  solPlan: SolPlan
): { state: MissionState; report: SolReport } {
  if (state.done) {
    const emptyReport: SolReport = {
      sol: state.sol,
      allocated: { air: 0, shield: 0, lab: 0 },
      wasCut: false,
      isDustSol: false,
      isStormSol: false,
      power: state.power,
      air: state.air,
      health: state.health,
      science: state.science,
      survived: state.survived,
      log: [],
    }
    return { state, report: emptyReport }
  }

  const sol = state.sol
  const { allocated, wasCut } = allocateBolts(state.power, solPlan)
  const solLog: string[] = []

  if (wasCut) {
    solLog.push(
      `Sol ${sol}: plan exceeded power budget. Allocated air=${allocated.air}, shield=${allocated.shield}, lab=${allocated.lab}.`
    )
  }

  const totalBolts = allocated.air + allocated.shield + allocated.lab
  const spentPower = totalBolts * BOLT_COST

  const isDustSol = state.dustSol === sol
  const isStormSol = state.stormSol === sol
  const sunlight = calculateSunlight(state.cfg.site, isDustSol)
  const power = Math.min(POWER_CAP, state.power - spentPower + sunlight)

  const airChange = calculateAirChange(allocated.air)
  let air = Math.min(AIR_CAP, state.air + airChange)
  if (air < 0) air = 0

  let science = state.science + allocated.lab * SCIENCE_PER_LAB_BOLT
  const diffMultiplier = getDifficultyMultiplier(state.cfg.difficulty)
  const cosmicLoss = calculateCosmicLoss(allocated.shield) * diffMultiplier

  let health = state.health
  let clock = state.clock

  if (isStormSol) {
    const setup = clockSetup(state.cfg, state.stormSol)
    const clockPlay = playClock(
      setup,
      solPlan.clock,
      allocated.shield,
      state.cfg.storm.tier,
      diffMultiplier
    )

    if (setup.oldMessage) {
      solLog.push(
        `Earth message arrived ${setup.delayMinutes} minutes late. It is old news.`
      )
    } else {
      solLog.push(`Earth said particles in about ${setup.forecastHours} hours.`)
    }
    for (const line of clockPlay.log) solLog.push(line)

    science += clockPlay.scienceGained
    health = Math.round(health - (cosmicLoss + clockPlay.stormDose))
    health = Math.max(0, Math.min(HEALTH_CAP, health))

    clock = {
      forecastHours: setup.forecastHours,
      delayMinutes: setup.delayMinutes,
      visibleHours: setup.visibleHours,
      oldMessage: setup.oldMessage,
      K: setup.K,
      A: setup.A,
      shelterBlock: clockPlay.shelterBlock,
      outcome: clockPlay.outcome,
      scienceGained: clockPlay.scienceGained,
      stormDose: clockPlay.stormDose,
      outcomeText: clockPlay.outcomeText,
      outcomeTextKey: clockPlay.outcomeTextKey,
      outcomeTextParams: clockPlay.outcomeTextParams,
    }
  } else {
    health = Math.round(health - cosmicLoss)
    health = Math.max(0, Math.min(HEALTH_CAP, health))
  }

  let survived = true
  let endedOnSol = state.endedOnSol
  let done = sol >= TOTAL_SOLS

  if (air <= 0 || health <= 0) {
    survived = false
    endedOnSol = sol
    done = true
    solLog.push(
      `Mission failed on sol ${sol}: ${air <= 0 ? 'air depleted' : 'crew health depleted'}.`
    )
  }

  const nextState: MissionState = {
    ...state,
    sol: done ? sol : sol + 1,
    done,
    survived,
    power,
    air,
    health,
    science,
    endedOnSol,
    clock,
    log: [...state.log, ...solLog],
  }

  const report: SolReport = {
    sol,
    allocated,
    wasCut,
    isDustSol,
    isStormSol,
    power,
    air,
    health,
    science,
    survived,
    log: solLog,
    clock: isStormSol ? clock : undefined,
  }
  nextState.reports = [...state.reports, report]

  return { state: nextState, report }
}

export function missionResult(state: MissionState): Result {
  return {
    survived: state.survived,
    stars: calculateStars(state.survived, state.science, state.health, state.cfg.site),
    power: state.power,
    air: state.air,
    health: state.health,
    science: state.science,
    minAir: Math.min(START_AIR, ...state.reports.map((report) => report.air)),
    endedOnSol: state.endedOnSol,
    stormSol: state.stormSol,
    dustSol: state.dustSol,
    clock: state.clock,
    log: state.log,
  }
}

export function runMission(cfg: MissionConfig, plan: Plan): Result {
  let state = createMission(cfg)
  for (let sol = 1; sol <= TOTAL_SOLS; sol++) {
    const solPlan = plan.sols[sol - 1] ?? { air: 0, shield: 0, lab: 0 }
    state = playSol(state, solPlan).state
    if (state.done) break
  }
  return missionResult(state)
}
