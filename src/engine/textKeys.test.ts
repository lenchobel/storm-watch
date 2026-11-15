import { describe, expect, it } from 'vitest'
import enStrings from '../i18n/strings.en.json'
import omStrings from '../i18n/strings.om.json'
import { translate } from '../i18n/translate'
import { loadStorms } from '../data/loadStorms'
import { clockOutcomeText, playClock } from './clock'
import { compareWorlds } from './compare'
import { buildSaverLine, findSaver } from './saver'
import { runMission } from './sim'
import type { ClockSetup, MissionConfig, Plan, Storm } from './types'

const smallParticleStorm: Storm = {
  id: 'text-small',
  source: 'saved',
  flareClass: 'M1.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 4,
  tier: 'small',
}

const shortGapStorm: Storm = {
  id: 'text-short',
  source: 'saved',
  flareClass: 'M2.0',
  flarePeak: '2024-05-10T12:00:00Z',
  gapHours: 2.1,
  tier: 'small',
}

function flatPlan(sol: { air: 0 | 1 | 2 | 3; shield: 0 | 1 | 2 | 3; lab: 0 | 1 | 2 | 3 }): Plan {
  return { sols: Array.from({ length: 7 }, () => ({ ...sol })) }
}

describe('text keys for engine sentences', () => {
  it('keeps the English and Afaan Oromoo catalogues on the same keys', () => {
    expect(Object.keys(omStrings).sort()).toEqual(Object.keys(enStrings).sort())
  })

  it('fills the saver template back to the exact English text', () => {
    const cfg: MissionConfig = {
      site: 'moon',
      storm: smallParticleStorm,
      seed: 1,
      difficulty: 'cadet',
    }
    const plan: Plan = {
      sols: [
        { air: 0, shield: 0, lab: 0 },
        { air: 0, shield: 0, lab: 0 },
        { air: 1, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
        { air: 2, shield: 0, lab: 0 },
      ],
    }
    const before = runMission(cfg, plan)
    const saver = findSaver(cfg, plan, before)

    expect(saver).not.toBeNull()
    expect(typeof saver!.textKey).toBe('string')
    expect(saver!.textParams).toBeTypeOf('object')
    expect(translate('en', saver!.textKey, saver!.textParams)).toBe(saver!.text)
  })

  it('fills a two-edit saver template back to the exact English text', () => {
    const cfg: MissionConfig = {
      site: 'moon',
      storm: smallParticleStorm,
      seed: 1,
      difficulty: 'cadet',
    }
    const before = runMission(cfg, flatPlan({ air: 0, shield: 0, lab: 0 }))
    const after = runMission(cfg, flatPlan({ air: 2, shield: 0, lab: 0 }))
    const line = buildSaverLine(
      [
        { kind: 'bolt', sol: 1, cat: 'air', delta: 1 },
        { kind: 'bolt', sol: 2, cat: 'air', delta: 1 },
      ],
      before,
      after
    )

    expect(typeof line.textKey).toBe('string')
    expect(translate('en', line.textKey, line.textParams)).toBe(line.text)
  })

  it('fills the compare sentence and every row back to the exact English text', () => {
    const moonCfg: MissionConfig = {
      site: 'moon',
      storm: shortGapStorm,
      seed: 1,
      difficulty: 'cadet',
    }
    const marsCfg: MissionConfig = { ...moonCfg, site: 'mars' }
    const plan = flatPlan({ air: 2, shield: 1, lab: 0 })
    const moon = runMission(moonCfg, plan)
    const mars = runMission(marsCfg, plan)
    const comparison = compareWorlds(
      { site: 'moon', result: moon },
      { site: 'mars', result: mars }
    )

    expect(typeof comparison.textKey).toBe('string')
    expect(translate('en', comparison.textKey, comparison.textParams)).toBe(
      comparison.sentence
    )

    for (const row of comparison.rows) {
      expect(translate('en', row.labelKey)).toBe(row.label)
      if (row.aKey) expect(translate('en', row.aKey, row.aParams)).toBe(row.a)
      if (row.bKey) expect(translate('en', row.bKey, row.bParams)).toBe(row.b)
    }
  })

  it('fills every Storm Clock outcome back to the exact English text', () => {
    const setup: ClockSetup = {
      hasParticles: true,
      forecastHours: 3,
      delayMinutes: 0,
      visibleHours: 3,
      oldMessage: false,
      K: 2,
      A: 1,
    }
    const outcomes = [
      clockOutcomeText({ ...setup, hasParticles: false }, 'false_alarm', 1, 0),
      clockOutcomeText({ ...setup, hasParticles: false }, 'false_alarm', 2, 0),
      clockOutcomeText(setup, 'caught', 1, 10),
      clockOutcomeText(setup, 'sheltered', 0, 12.5),
    ]

    for (const outcome of outcomes) {
      expect(typeof outcome.outcomeTextKey).toBe('string')
      expect(translate('en', outcome.outcomeTextKey, outcome.outcomeTextParams)).toBe(
        outcome.outcomeText
      )
    }
  })

  it('puts the same Storm Clock text fields on playClock results', () => {
    const setup: ClockSetup = {
      hasParticles: true,
      forecastHours: 3,
      delayMinutes: 0,
      visibleHours: 3,
      oldMessage: false,
      K: 2,
      A: 1,
    }
    const played = playClock(setup, ['shelter'], 0, 'small', 1)

    expect(played.outcomeTextKey).toBe('clock.outcome.sheltered')
    expect(translate('en', played.outcomeTextKey, played.outcomeTextParams)).toBe(
      played.outcomeText
    )
  })

  it('adds a text key to the live NASA storm label', async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input)
      if (url.includes('type=FLR')) {
        return new Response(
          JSON.stringify([
            {
              flrID: '2026-11-10T10:00:00-FLR-001',
              classType: 'X1.2',
              peakTime: '2026-11-10T10:15Z',
              linkedEvents: null,
            },
          ]),
          { status: 200 }
        )
      }
      return new Response(
        JSON.stringify([
          {
            sepID: '2026-11-10T12:15:00-SEP-001',
            eventTime: '2026-11-10T12:15Z',
            linkedEvents: [{ activityID: '2026-11-10T10:00:00-FLR-001' }],
          },
        ]),
        { status: 200 }
      )
    }

    const res = await loadStorms(mockFetch)
    expect(res.storms[0].label).toBe('Latest from NASA')
    expect(res.storms[0].labelKey).toBe('badge.latestFromNasa')
    expect(translate('en', res.storms[0].labelKey!)).toBe(res.storms[0].label)
  })
})
