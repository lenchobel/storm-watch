import type { StormBadge } from '../data/loadStorms'
import { createMission, missionResult, playSol } from '../engine/sim'
import type { MissionConfig } from '../engine/types'
import type {
  ClockMove,
  Difficulty,
  MissionState,
  Prediction,
  Result,
  Site,
  SolPlan,
  SolReport,
  Storm,
} from '../engine/types'
import type { InfoPageId } from './components/InfoNav'

export type ScreenName = 'picker' | 'collection' | 'briefing' | 'sol' | 'clock' | 'debrief'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export interface AppState {
  screen: ScreenName
  infoPage: InfoPageId | null
  storms: Storm[]
  badge: StormBadge
  site: Site
  stormId: string
  difficulty: Difficulty
  seed: number
  mission: MissionState | null
  solPlan: SolPlan
  solPlans: SolPlan[]
  pendingClockOutcome: { nextState: MissionState; report: SolReport } | null
  finalResult: Result | null
  worldResults: Record<string, { moon?: Result; mars?: Result }>
  muted: boolean
  challengeStars: number | null
  prediction: Prediction | null
  isOffline: boolean
  installPrompt: BeforeInstallPromptEvent | null
}

export type AppAction =
  | { type: 'LOADED_STORMS'; storms: Storm[]; badge: StormBadge }
  | { type: 'SET_SITE'; site: Site }
  | { type: 'SET_STORM'; id: string }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'GO_BRIEFING' }
  | { type: 'DAILY_MISSION'; config: MissionConfig }
  | { type: 'OPEN_COLLECTION' }
  | { type: 'SET_PREDICTION'; prediction: Prediction }
  | {
      type: 'START_MISSION'
      seed?: number
      site?: Site
      stormId?: string
      difficulty?: Difficulty
    }
  | { type: 'SET_SOL_PLAN'; plan: SolPlan }
  | { type: 'SUBMIT_SOL' }
  | { type: 'FINISH_CLOCK'; moves: ClockMove[] }
  | { type: 'CONTINUE_AFTER_CLOCK' }
  | { type: 'BACK_PICKER' }
  | { type: 'OPEN_INFO'; page: InfoPageId | null }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_OFFLINE'; offline: boolean }
  | { type: 'SET_INSTALL_PROMPT'; event: BeforeInstallPromptEvent | null }

export const DEFAULT_SOL_PLAN: SolPlan = { air: 2, shield: 1, lab: 0 }

export function defaultPlanFor(difficulty: Difficulty): SolPlan {
  return difficulty === 'cadet'
    ? { air: 2, shield: 1, lab: 0 }
    : { air: 2, shield: 0, lab: 0 }
}

function recordWorldResult(
  map: AppState['worldResults'],
  key: string,
  site: Site,
  result: Result
): AppState['worldResults'] {
  return {
    ...map,
    [key]: { ...map[key], [site]: result },
  }
}

export function missionReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOADED_STORMS': {
      const keepCurrent = action.storms.some((s) => s.id === state.stormId)
      const nextId = keepCurrent ? state.stormId : action.storms[0].id
      const nextStorm =
        action.storms.find((s) => s.id === nextId) ?? action.storms[0]
      const updatedMission = state.mission
        ? { ...state.mission, cfg: { ...state.mission.cfg, storm: nextStorm } }
        : null
      return {
        ...state,
        storms: action.storms,
        badge: action.badge,
        stormId: nextId,
        mission: updatedMission,
      }
    }
    case 'SET_SITE':
      return { ...state, site: action.site }
    case 'SET_STORM':
      return { ...state, stormId: action.id }
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }
    case 'GO_BRIEFING':
      return { ...state, screen: 'briefing', infoPage: null }
    case 'DAILY_MISSION':
      return {
        ...state,
        screen: 'briefing',
        infoPage: null,
        site: action.config.site,
        stormId: action.config.storm.id,
        difficulty: action.config.difficulty,
        seed: action.config.seed,
        prediction: null,
      }
    case 'OPEN_COLLECTION':
      return { ...state, screen: 'collection', infoPage: null }
    case 'SET_PREDICTION':
      return { ...state, prediction: action.prediction }
    case 'START_MISSION': {
      const site = action.site ?? state.site
      const difficulty = action.difficulty ?? state.difficulty
      const seed = action.seed ?? state.seed
      const stormId = action.stormId ?? state.stormId
      const storm =
        state.storms.find((s) => s.id === stormId) ?? state.storms[0]
      const mission = createMission({ site, storm, seed, difficulty })
      return {
        ...state,
        screen: 'sol',
        infoPage: null,
        site,
        difficulty,
        seed,
        stormId: storm.id,
        mission,
        solPlan: defaultPlanFor(difficulty),
        solPlans: [],
        pendingClockOutcome: null,
        finalResult: null,
        prediction: null,
      }
    }
    case 'SET_SOL_PLAN':
      return { ...state, solPlan: action.plan }
    case 'SUBMIT_SOL': {
      if (!state.mission) return state
      if (state.mission.sol === state.mission.stormSol) {
        return { ...state, screen: 'clock', pendingClockOutcome: null }
      }
      const { state: nextState } = playSol(state.mission, state.solPlan)
      const nextPlans = [...state.solPlans, state.solPlan]
      if (nextState.done) {
        const res = missionResult(nextState)
        const key = `${nextState.cfg.storm.id}:${nextState.cfg.seed}`
        return {
          ...state,
          mission: nextState,
          solPlans: nextPlans,
          finalResult: res,
          screen: 'debrief',
          worldResults: recordWorldResult(state.worldResults, key, nextState.cfg.site, res),
        }
      }
      return { ...state, mission: nextState, solPlans: nextPlans }
    }
    case 'FINISH_CLOCK': {
      if (!state.mission) return state
      const fullSolPlan: SolPlan = { ...state.solPlan, clock: action.moves }
      const { state: nextState, report } = playSol(state.mission, fullSolPlan)
      return {
        ...state,
        solPlans: [...state.solPlans, fullSolPlan],
        pendingClockOutcome: { nextState, report },
      }
    }
    case 'CONTINUE_AFTER_CLOCK': {
      if (!state.pendingClockOutcome) return state
      const { nextState } = state.pendingClockOutcome
      if (nextState.done) {
        const res = missionResult(nextState)
        const key = `${nextState.cfg.storm.id}:${nextState.cfg.seed}`
        return {
          ...state,
          mission: nextState,
          pendingClockOutcome: null,
          finalResult: res,
          screen: 'debrief',
          worldResults: recordWorldResult(state.worldResults, key, nextState.cfg.site, res),
        }
      }
      return { ...state, mission: nextState, pendingClockOutcome: null, screen: 'sol' }
    }
    case 'BACK_PICKER':
      return { ...state, screen: 'picker', infoPage: null }
    case 'OPEN_INFO':
      return { ...state, infoPage: action.page }
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted }
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.offline }
    case 'SET_INSTALL_PROMPT':
      return { ...state, installPrompt: action.event }
  }
}
