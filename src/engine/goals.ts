import { previewClock } from './clock'
import { mulberry32, nextInt } from './rng'
import type { GoalId, MissionConfig, Result } from './types'

const GOAL_IDS: GoalId[] = [
  'boldCall',
  'leanMachine',
  'safeHands',
  'scienceSprint',
  'ironCrew',
]
const GOAL_SEED = 0x51ed270b

function eligibleGoals(cfg: MissionConfig): GoalId[] {
  const eligible: GoalId[] = GOAL_IDS.filter((id) => id !== 'boldCall')
  const clock = previewClock(cfg)
  if (cfg.storm.gapHours !== undefined && clock.K >= 2) {
    eligible.push('boldCall')
  }
  return eligible
}

export function goalsFor(cfg: MissionConfig): GoalId[] {
  const goals = eligibleGoals(cfg)
  const rng = mulberry32((cfg.seed ^ GOAL_SEED) >>> 0)
  for (let i = goals.length - 1; i > 0; i--) {
    const j = nextInt(rng, 0, i)
    ;[goals[i], goals[j]] = [goals[j], goals[i]]
  }
  return goals.slice(0, 3)
}

export function goalIsDone(
  id: GoalId,
  cfg: MissionConfig,
  result: Result
): boolean {
  if (id === 'boldCall') {
    const clock = result.clock
    return Boolean(
      cfg.storm.gapHours !== undefined &&
        clock &&
        clock.K >= 2 &&
        clock.outcome === 'sheltered' &&
        clock.shelterBlock !== null &&
        clock.shelterBlock >= Math.max(1, clock.K - 1)
    )
  }
  if (id === 'leanMachine') return result.power >= 30
  if (id === 'safeHands') return result.minAir >= 40
  if (id === 'scienceSprint') return result.science >= 10
  return result.health >= 70
}

export function evaluateGoals(
  cfg: MissionConfig,
  result: Result
): Array<{ id: GoalId; done: boolean }> {
  return goalsFor(cfg).map((id) => ({ id, done: goalIsDone(id, cfg, result) }))
}
