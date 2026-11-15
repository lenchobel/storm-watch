import { describe, expect, it } from 'vitest'
import { linkStorms, type DonkiFlare, type DonkiSep } from './donkiLink'

// Fixture built from REAL NASA CCMC DONKI samples inspected on 2026-11-14:
// - Flare 2024-05-09T08:45:00-FLR-001 (X2.2, peak 2024-05-09T09:13Z) linked to SEP 2024-05-09T13:59Z
// - Flare 2024-05-10T00:10:00-FLR-001 (M1.3, peak 2024-05-10T00:13Z) with linkedEvents: null
const realFlareSample: DonkiFlare[] = [
  {
    flrID: '2024-05-09T08:45:00-FLR-001',
    classType: 'X2.2',
    peakTime: '2024-05-09T09:13Z',
    linkedEvents: null,
  },
  {
    flrID: '2024-05-10T00:10:00-FLR-001',
    classType: 'M1.3',
    peakTime: '2024-05-10T00:13Z',
    linkedEvents: null,
  },
]

const realSepSample: DonkiSep[] = [
  {
    sepID: '2024-05-09T13:59:00-SEP-001',
    eventTime: '2024-05-09T13:59Z',
    linkedEvents: [{ activityID: '2024-05-09T08:45:00-FLR-001' }],
  },
]

describe('donkiLink', () => {
  it('links real DONKI flare and SEP samples and marks unlinked flares as false alarms', () => {
    const storms = linkStorms(realFlareSample, realSepSample, 'saved')
    expect(storms).toHaveLength(2)

    const particle = storms.find((s) => s.id === '2024-05-09T08:45:00-FLR-001')
    expect(particle).toBeDefined()
    expect(particle!.tier).toBe('big')
    expect(particle!.gapHours).toBeCloseTo(4.77, 2)
    expect(particle!.sepStart).toBe('2024-05-09T13:59Z')
    expect(particle!.source).toBe('saved')

    const falseAlarm = storms.find((s) => s.id === '2024-05-10T00:10:00-FLR-001')
    expect(falseAlarm).toBeDefined()
    expect(falseAlarm!.gapHours).toBeUndefined()
    expect(falseAlarm!.tier).toBe('small')
  })

  it('rejects linked storms with gapHours outside [0.25, 48] such as 0.2h and 60h', () => {
    const flares: DonkiFlare[] = [
      {
        flrID: 'flr-too-short',
        classType: 'X1.0',
        peakTime: '2024-05-10T10:00:00Z',
        linkedEvents: [{ activityID: 'sep-short' }],
      },
      {
        flrID: 'flr-too-long',
        classType: 'M5.0',
        peakTime: '2024-05-10T10:00:00Z',
        linkedEvents: [{ activityID: 'sep-long' }],
      },
      {
        flrID: 'flr-valid',
        classType: 'M2.0',
        peakTime: '2024-05-10T10:00:00Z',
        linkedEvents: [{ activityID: 'sep-valid' }],
      },
    ]
    const seps: DonkiSep[] = [
      { sepID: 'sep-short', eventTime: '2024-05-10T10:12:00Z', linkedEvents: null }, // 0.2h
      { sepID: 'sep-long', eventTime: '2024-05-12T22:00:00Z', linkedEvents: null }, // 60h
      { sepID: 'sep-valid', eventTime: '2024-05-10T12:00:00Z', linkedEvents: null }, // 2.0h
    ]

    const storms = linkStorms(flares, seps, 'live')
    expect(storms).toHaveLength(1)
    expect(storms[0].id).toBe('flr-valid')
    expect(storms[0].tier).toBe('medium')
    expect(storms[0].source).toBe('live')
  })
})
