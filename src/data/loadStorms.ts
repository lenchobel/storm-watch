import gameStormsData from './gameStorms.json'
import { linkStorms, type DonkiFlare, type DonkiSep } from './donkiLink'
import type { Storm } from '../engine/types'

export interface StormBadge {
  kind: 'LIVE' | 'SAVED'
  date: string
}

export interface LoadedStorms {
  storms: Storm[]
  badge: StormBadge
}

const LIVE_TIMEOUT_MS = 8000
const LIVE_WINDOW_DAYS = 55

function getSavedStorms(): Storm[] {
  return (gameStormsData.storms as Storm[]).map((s) => ({
    ...s,
    source: 'saved',
  }))
}

async function fetchJsonWithTimeout<T>(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function loadStorms(
  fetchImpl: typeof fetch = fetch,
  timeoutMs = LIVE_TIMEOUT_MS
): Promise<LoadedStorms> {
  const saved = getSavedStorms()
  const savedDate = gameStormsData.fetchedAt.slice(0, 10)

  const end = new Date()
  const start = new Date(end.getTime() - LIVE_WINDOW_DAYS * 86400_000)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  try {
    const [flares, seps] = await Promise.all([
      fetchJsonWithTimeout<DonkiFlare[]>(
        fetchImpl,
        `/api/donki?type=FLR&start=${startStr}&end=${endStr}`,
        timeoutMs
      ),
      fetchJsonWithTimeout<DonkiSep[]>(
        fetchImpl,
        `/api/donki?type=SEP&start=${startStr}&end=${endStr}`,
        timeoutMs
      ),
    ])

    if (!Array.isArray(flares) || !Array.isArray(seps)) {
      return { storms: saved, badge: { kind: 'SAVED', date: savedDate } }
    }

    const linked = linkStorms(flares, seps, 'live')
    if (linked.length === 0) {
      return { storms: saved, badge: { kind: 'SAVED', date: savedDate } }
    }

    const sorted = [...linked].sort(
      (a, b) => Date.parse(b.flarePeak) - Date.parse(a.flarePeak)
    )
    const newest: Storm = {
      ...sorted[0],
      source: 'live',
      label: 'Latest from NASA',
      labelKey: 'badge.latestFromNasa',
    }
    const dedupedSaved = saved.filter((s) => s.id !== newest.id)

    return {
      storms: [newest, ...dedupedSaved],
      badge: { kind: 'LIVE', date: newest.flarePeak.slice(0, 10) },
    }
  } catch {
    return { storms: saved, badge: { kind: 'SAVED', date: savedDate } }
  }
}
