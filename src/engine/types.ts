export type Site = 'moon' | 'mars'
export type Tier = 'small' | 'medium' | 'big'
export type Difficulty = 'cadet' | 'commander'

/**
 * A text value can be a plain value or a reference to another text key.
 * The UI resolves references while it fills placeholders.
 */
export type TextParam = string | number | { key: string; params?: TextParams }
export type TextParams = Record<string, TextParam>

export type ClockMove = 'work' | 'shelter'
export type ClockOutcome = 'sheltered' | 'caught' | 'false_alarm'
export type GoalId = 'boldCall' | 'leanMachine' | 'safeHands' | 'scienceSprint' | 'ironCrew'
export type Prediction = 'yes' | 'no' | 'unsure'

export interface Storm {
  id: string
  source: 'live' | 'saved'
  flareClass: string
  flarePeak: string
  sepStart?: string
  gapHours?: number
  tier: Tier
  label?: string
  labelKey?: string
}

export interface SolPlan {
  air: 0 | 1 | 2 | 3
  shield: 0 | 1 | 2 | 3
  lab: 0 | 1 | 2 | 3
  clock?: ClockMove[]
}

export interface Plan {
  sols: SolPlan[]
  cards?: number[]
}

export interface ClockSetup {
  hasParticles: boolean
  forecastHours: number
  delayMinutes: number
  visibleHours: number
  oldMessage: boolean
  K: number
  A: number | null
}

export interface ClockResult {
  forecastHours: number
  delayMinutes: number
  visibleHours: number
  oldMessage: boolean
  K: number
  A: number | null
  shelterBlock: number | null
  outcome: ClockOutcome
  scienceGained: number
  stormDose: number
  outcomeText: string
  outcomeTextKey: string
  outcomeTextParams: TextParams
}

export interface PlayClockResult {
  scienceGained: number
  stormDose: number
  outcome: ClockOutcome
  shelterBlock: number | null
  log: string[]
  outcomeText: string
  outcomeTextKey: string
  outcomeTextParams: TextParams
}

export interface Result {
  survived: boolean
  stars: 0 | 1 | 2 | 3
  power: number
  air: number
  health: number
  science: number
  minAir: number
  endedOnSol: number
  stormSol: number
  dustSol?: number | null
  clock?: ClockResult
  log: string[]
}

export interface MissionConfig {
  site: Site
  storm: Storm
  seed: number
  difficulty: Difficulty
}

export type ClockStepStatus = 'continue' | 'sheltered' | 'caught' | 'done'

export interface ClockStepResult {
  status: ClockStepStatus
  block: number
}

export interface SolReport {
  sol: number
  allocated: { air: number; shield: number; lab: number }
  wasCut: boolean
  isDustSol: boolean
  isStormSol: boolean
  power: number
  air: number
  health: number
  science: number
  survived: boolean
  log: string[]
  clock?: ClockResult
}

export interface MissionState {
  cfg: MissionConfig
  sol: number
  done: boolean
  survived: boolean
  power: number
  air: number
  health: number
  science: number
  endedOnSol: number
  stormSol: number
  dustSol: number | null
  clock?: ClockResult
  log: string[]
  reports: SolReport[]
}
