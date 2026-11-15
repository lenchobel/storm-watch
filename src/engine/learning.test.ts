import { describe, expect, it } from 'vitest'
import { conceptFor } from './learning'
import type { MissionConfig, Result } from './types'

const cfg: MissionConfig = { site: 'moon', storm: { id: 's', source: 'saved', flareClass: 'M1', flarePeak: '2024-01-01', gapHours: 2, tier: 'small' }, seed: 1, difficulty: 'cadet' }
const result: Result = { survived: true, stars: 2, power: 40, air: 60, health: 80, science: 4, minAir: 50, endedOnSol: 7, stormSol: 4, log: [], clock: { forecastHours: 2, delayMinutes: 0, visibleHours: 2, oldMessage: false, K: 2, A: 2, shelterBlock: 1, outcome: 'sheltered', scienceGained: 0, stormDose: 2, outcomeText: '', outcomeTextKey: '', outcomeTextParams: {} } }

describe('learning concept choice', () => {
  it('chooses each concept from the run outcome', () => {
    expect(conceptFor(cfg, { ...result, clock: { ...result.clock!, outcome: 'caught' } })).toBe('caught')
    expect(conceptFor(cfg, result)).toBe('sheltered')
    expect(conceptFor({ ...cfg, storm: { ...cfg.storm, gapHours: undefined } }, result)).toBe('falseAlarm')
    expect(conceptFor(cfg, { ...result, air: 0, clock: undefined })).toBe('air')
    expect(conceptFor({ ...cfg, site: 'mars' }, { ...result, clock: { ...result.clock!, oldMessage: true, outcome: 'false_alarm', shelterBlock: null } })).toBe('marsDelay')
  })
})
