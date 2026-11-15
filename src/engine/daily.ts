import type { Difficulty, MissionConfig, Site, Storm } from './types'

export function dayNumber(date: Date): number {
  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor(Date.UTC(localMidnight.getFullYear(), localMidnight.getMonth(), localMidnight.getDate()) / 86_400_000)
}

export function dailyMission(storms: Storm[], date: Date): MissionConfig {
  const day = dayNumber(date)
  const storm = storms[((day % storms.length) + storms.length) % storms.length]
  return {
    site: day % 2 === 0 ? 'moon' : 'mars' as Site,
    storm,
    difficulty: 'cadet' as Difficulty,
    seed: (day * 7919) % 100_000,
  }
}
