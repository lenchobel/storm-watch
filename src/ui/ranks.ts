import type { Difficulty, Site, Storm } from '../engine/types'
import { bestStarsKey, type Progress } from './progress'

export interface Rank { name: string; stars: number }
export const RANKS: Rank[] = [
  { name: 'Rookie', stars: 0 },
  { name: 'Cadet', stars: 4 },
  { name: 'Crew Member', stars: 10 },
  { name: 'Flight Engineer', stars: 20 },
  { name: 'Flight Director', stars: 30 },
]

export function totalStars(progress: Progress, storms: Storm[]): number {
  const total = storms.reduce((sum, storm) => {
    return (['moon', 'mars'] as Site[]).reduce((siteSum, site) => {
      const best = (['cadet', 'commander'] as Difficulty[]).reduce(
        (difficultyBest, difficulty) =>
          Math.max(difficultyBest, progress.bestStars[bestStarsKey(storm.id, site, difficulty)] ?? 0),
        0
      )
      return siteSum + best
    }, sum)
  }, 0)
  return Math.min(36, total)
}

export function rankFor(stars: number): { current: Rank; next: Rank | null; remaining: number } {
  const current = [...RANKS].reverse().find((rank) => stars >= rank.stars) ?? RANKS[0]
  const next = RANKS.find((rank) => rank.stars > current.stars) ?? null
  return { current, next, remaining: next ? Math.max(0, next.stars - stars) : 0 }
}
