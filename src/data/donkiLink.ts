import type { Storm, Tier } from '../engine/types'

export interface DonkiLinkedEvent {
  activityID: string
}

export interface DonkiFlare {
  flrID: string
  classType: string
  peakTime: string
  linkedEvents?: DonkiLinkedEvent[] | null
}

export interface DonkiSep {
  sepID: string
  eventTime: string
  linkedEvents?: DonkiLinkedEvent[] | null
}

export const MIN_GAP_HOURS = 0.25
export const MAX_GAP_HOURS = 48

export function tierForClass(
  flareClass: string,
  hasParticles: boolean
): Tier {
  const upper = flareClass.trim().toUpperCase()
  if (hasParticles) {
    if (upper.startsWith('X')) return 'big'
    if (upper.startsWith('M')) return 'medium'
    return 'small'
  }
  return upper.startsWith('X') ? 'medium' : 'small'
}

export function linkStorms(
  flares: DonkiFlare[],
  seps: DonkiSep[],
  source: 'saved' | 'live' = 'saved'
): Storm[] {
  const sepById = new Map<string, DonkiSep>()
  const sepsByFlareId = new Map<string, DonkiSep[]>()

  for (const sep of seps) {
    if (!sep.sepID || !sep.eventTime) continue
    sepById.set(sep.sepID, sep)
    for (const ev of sep.linkedEvents ?? []) {
      if (ev.activityID && ev.activityID.includes('-FLR-')) {
        const list = sepsByFlareId.get(ev.activityID) ?? []
        list.push(sep)
        sepsByFlareId.set(ev.activityID, list)
      }
    }
  }

  const storms: Storm[] = []

  for (const flr of flares) {
    if (!flr.flrID || !flr.peakTime || !flr.classType) continue
    const peakMs = Date.parse(flr.peakTime)
    if (Number.isNaN(peakMs)) continue

    const linkedSeps = new Map<string, DonkiSep>()
    for (const ev of flr.linkedEvents ?? []) {
      const match = ev.activityID ? sepById.get(ev.activityID) : undefined
      if (match) linkedSeps.set(match.sepID, match)
    }
    for (const match of sepsByFlareId.get(flr.flrID) ?? []) {
      linkedSeps.set(match.sepID, match)
    }

    if (linkedSeps.size === 0) {
      storms.push({
        id: flr.flrID,
        source,
        flareClass: flr.classType,
        flarePeak: flr.peakTime,
        tier: tierForClass(flr.classType, false),
      })
      continue
    }

    // Find earliest linked SEP within the valid 0.25h..48h arrival window
    let bestSep: DonkiSep | null = null
    let bestGap = Infinity
    for (const sep of linkedSeps.values()) {
      const sepMs = Date.parse(sep.eventTime)
      if (Number.isNaN(sepMs)) continue
      const gapHours = (sepMs - peakMs) / (1000 * 60 * 60)
      if (gapHours >= MIN_GAP_HOURS && gapHours <= MAX_GAP_HOURS && gapHours < bestGap) {
        bestGap = gapHours
        bestSep = sep
      }
    }

    if (!bestSep) {
      // Linked SEP existed outside [0.25, 48] hours — reject from storm pool
      continue
    }

    storms.push({
      id: flr.flrID,
      source,
      flareClass: flr.classType,
      flarePeak: flr.peakTime,
      sepStart: bestSep.eventTime,
      gapHours: Math.round(bestGap * 100) / 100,
      tier: tierForClass(flr.classType, true),
    })
  }

  return storms
}
