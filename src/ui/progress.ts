import type { Difficulty, GoalId, Prediction, Site } from '../engine/types'

export const PROGRESS_KEY = 'storm-watch-v1'
export function localDayKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
export type LanguageSetting = 'en' | 'om'
export interface RunRecord {
  date: string
  stormId: string
  site: Site
  difficulty: Difficulty
  stars: 0 | 1 | 2 | 3
  goalsDone: GoalId[]
}
export interface Progress {
  version: 1
  bestStars: Record<string, 0 | 1 | 2 | 3>
  runs: RunRecord[]
  daysPlayed: string[]
  forecaster: { right: number; guesses: number }
  settings: { language: LanguageSetting; muted: boolean; vibration: boolean; classroom: boolean; simpleView: boolean }
}
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const emptyProgress = (): Progress => ({
  version: 1,
  bestStars: {},
  runs: [],
  daysPlayed: [],
  forecaster: { right: 0, guesses: 0 },
  settings: { language: 'en', muted: false, vibration: true, classroom: false, simpleView: false },
})
let memoryProgress = emptyProgress()

function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function parseProgress(raw: string | null): Progress | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Progress>
    if (value.version !== 1 || !value.bestStars || !Array.isArray(value.runs)) return null
    const defaults = emptyProgress()
    return {
      ...defaults,
      ...value,
      daysPlayed: Array.isArray(value.daysPlayed) ? value.daysPlayed : [],
      forecaster: value.forecaster ?? defaults.forecaster,
      settings: { ...defaults.settings, ...value.settings },
    }
  } catch {
    return null
  }
}

export function recordForecast(current: Progress, prediction: Prediction, particlesCame: boolean, storage = browserStorage()): Progress {
  if (prediction === 'unsure') return structuredClone(current)
  const correct = (prediction === 'yes') === particlesCame
  return saveProgress({ ...current, forecaster: {
    right: current.forecaster.right + (correct ? 1 : 0),
    guesses: current.forecaster.guesses + 1,
  } }, storage)
}

export function loadProgress(storage = browserStorage()): Progress {
  try {
    const raw = storage?.getItem(PROGRESS_KEY) ?? null
    const saved = parseProgress(raw)
    if (saved) memoryProgress = saved
    if (raw !== null && !saved) {
      memoryProgress = emptyProgress()
      return structuredClone(memoryProgress)
    }
    return structuredClone(saved ?? memoryProgress)
  } catch {
    return structuredClone(memoryProgress)
  }
}

export function saveProgress(next: Progress, storage = browserStorage()): Progress {
  memoryProgress = structuredClone(next)
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(next))
  } catch {
    // Keep this session's progress when device storage is unavailable.
  }
  return structuredClone(memoryProgress)
}

export function bestStarsKey(stormId: string, site: Site, difficulty: Difficulty) {
  return `${stormId}:${site}:${difficulty}`
}

export function recordRun(
  current: Progress,
  run: RunRecord,
  storage = browserStorage()
): Progress {
  const key = bestStarsKey(run.stormId, run.site, run.difficulty)
  const oldBest = current.bestStars[key] ?? 0
  const next = {
    ...current,
    bestStars: { ...current.bestStars, [key]: Math.max(oldBest, run.stars) as 0 | 1 | 2 | 3 },
    runs: [...current.runs, run].slice(-30),
    daysPlayed: [...new Set([...current.daysPlayed, run.date])],
  }
  return saveProgress(next, storage)
}

export function updateSettings(
  settings: Partial<Progress['settings']>,
  storage = browserStorage()
): Progress {
  const current = loadProgress(storage)
  return saveProgress({ ...current, settings: { ...current.settings, ...settings } }, storage)
}

export function clearProgress(storage = browserStorage()): Progress {
  const settings = loadProgress(storage).settings
  const clean = { ...emptyProgress(), settings }
  try {
    storage?.removeItem(PROGRESS_KEY)
  } catch {
    // Memory reset remains available when storage is blocked.
  }
  memoryProgress = clean
  return structuredClone(clean)
}
