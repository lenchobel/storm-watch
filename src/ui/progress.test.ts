import { describe, expect, it } from 'vitest'
import { clearProgress, loadProgress, PROGRESS_KEY, recordForecast, recordRun, saveProgress, type StorageLike } from './progress'
import { rankFor, totalStars } from './ranks'

class MemoryStorage implements StorageLike {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

describe('versioned progress', () => {
  it('saves, loads, caps history, and tracks best stars', () => {
    const storage = new MemoryStorage()
    let progress = loadProgress(storage)
    for (let i = 0; i < 32; i++) progress = recordRun(progress, {
      date: `2026-11-${String(i + 1).padStart(2, '0')}`, stormId: 's1', site: 'moon',
      difficulty: 'cadet', stars: i === 3 ? 3 : 1, goalsDone: [],
    }, storage)
    expect(storage.getItem(PROGRESS_KEY)).toContain('"version":1')
    expect(loadProgress(storage).runs).toHaveLength(30)
    expect(loadProgress(storage).bestStars['s1:moon:cadet']).toBe(3)
  })

  it('resets corrupt and unsupported versions', () => {
    const storage = new MemoryStorage()
    storage.setItem(PROGRESS_KEY, '{bad')
    expect(loadProgress(storage).bestStars).toEqual({})
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 2, bestStars: {}, runs: [] }))
    expect(loadProgress(storage).version).toBe(1)
  })

  it('tracks correct forecasts and ignores unsure guesses', () => {
    const storage = new MemoryStorage()
    const initial = loadProgress(storage)
    const unsure = recordForecast(initial, 'unsure', true, storage)
    expect(unsure.forecaster).toEqual({ right: 0, guesses: 0 })
    const correct = recordForecast(unsure, 'yes', true, storage)
    expect(recordForecast(correct, 'no', true, storage).forecaster).toEqual({ right: 1, guesses: 2 })
  })

  it('uses memory fallback when storage throws and clears progress', () => {
    const broken: StorageLike = { getItem() { throw Error() }, setItem() { throw Error() }, removeItem() { throw Error() } }
    const saved = saveProgress({ ...loadProgress(broken), bestStars: { 's:moon:cadet': 2 } }, broken)
    expect(loadProgress(broken).bestStars['s:moon:cadet']).toBe(2)
    expect(clearProgress(broken).bestStars).toEqual({})
    expect(saved.version).toBe(1)
  })

  it('sums each storm and site best across difficulty and assigns ranks', () => {
    const progress = loadProgress(new MemoryStorage())
    progress.bestStars = { 's1:moon:cadet': 2, 's1:moon:commander': 3, 's1:mars:cadet': 1 }
    expect(totalStars(progress, [{ id: 's1' } as never])).toBe(4)
    expect(rankFor(0).current.name).toBe('Rookie')
    expect(rankFor(3).next?.name).toBe('Cadet')
    expect(rankFor(4).current.name).toBe('Cadet')
    expect(rankFor(9).next?.name).toBe('Crew Member')
    expect(rankFor(10).current.name).toBe('Crew Member')
    expect(rankFor(19).next?.name).toBe('Flight Engineer')
    expect(rankFor(20).current.name).toBe('Flight Engineer')
    expect(rankFor(29).next?.name).toBe('Flight Director')
    expect(rankFor(21).current.name).toBe('Flight Engineer')
    expect(rankFor(30).current.name).toBe('Flight Director')
  })
})
