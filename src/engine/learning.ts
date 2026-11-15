import type { MissionConfig, Result } from './types'

export type ConceptId = 'caught' | 'sheltered' | 'falseAlarm' | 'air' | 'marsDelay'

export function conceptFor(cfg: MissionConfig, result: Result): ConceptId | null {
  const clock = result.clock
  if (cfg.storm.gapHours === undefined && clock?.shelterBlock !== null && clock?.shelterBlock !== undefined && clock.shelterBlock < clock.K) return 'falseAlarm'
  if (clock?.outcome === 'caught') return 'caught'
  if (clock?.outcome === 'sheltered') return 'sheltered'
  if (result.air === 0) return 'air'
  if (cfg.site === 'mars' && clock?.oldMessage) return 'marsDelay'
  return null
}
