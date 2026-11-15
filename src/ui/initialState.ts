import gameStormsData from '../data/gameStorms.json'
import { createMission } from '../engine/sim'
import type { Difficulty, Site, Storm } from '../engine/types'
import type { AppState } from './missionReducer'
import { defaultPlanFor } from './missionReducer'
import { loadProgress } from './progress'

export function createInitialState(): AppState {
  const savedStorms = (gameStormsData.storms as Storm[]).map((storm) => ({ ...storm, source: 'saved' as const }))
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const siteParam: Site = params.get('site') === 'mars' ? 'mars' : 'moon'
  const diffParam: Difficulty = params.get('difficulty') === 'commander' ? 'commander' : 'cadet'
  const seedRaw = params.get('seed')
  const stormParam = params.get('storm')
  const stormMatch = savedStorms.find((storm) => storm.id === stormParam)
  const matchedStorm = stormMatch ?? savedStorms[0]
  const validSeed = seedRaw !== null && Number.isSafeInteger(Number(seedRaw))
  const parsedSeed = validSeed ? Number(seedRaw) : 101
  const beatRaw = params.get('beat')
  const beat = beatRaw !== null && /^[0-3]$/.test(beatRaw) ? Number(beatRaw) : null
  const validChallenge = validSeed && !!stormMatch && beat !== null &&
    (params.get('site') === 'moon' || params.get('site') === 'mars') &&
    (params.get('difficulty') === 'cadet' || params.get('difficulty') === 'commander')
  const cfg = { site: siteParam, storm: matchedStorm, seed: parsedSeed, difficulty: diffParam }
  return {
    screen: validSeed ? 'sol' : 'picker', infoPage: null, storms: savedStorms,
    badge: { kind: 'SAVED', date: gameStormsData.fetchedAt.slice(0, 10) },
    site: siteParam, stormId: matchedStorm.id, difficulty: diffParam, seed: parsedSeed,
    mission: validSeed ? createMission(cfg) : null,
    solPlan: defaultPlanFor(diffParam), solPlans: [], pendingClockOutcome: null,
    finalResult: null, worldResults: {}, muted: loadProgress().settings.muted,
    challengeStars: validChallenge ? beat : null,
    prediction: null,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    installPrompt: null,
  }
}
