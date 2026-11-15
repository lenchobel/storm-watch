import { describe, expect, it } from 'vitest'
import gameStorms from './gameStorms.json'
import { loadStorms } from './loadStorms'

describe('loadStorms', () => {
  it('returns LIVE badge and prepends Latest from NASA when live proxy succeeds', async () => {
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
    expect(res.badge).toEqual({ kind: 'LIVE', date: '2026-11-10' })
    expect(res.storms).toHaveLength(gameStorms.storms.length + 1)
    expect(res.storms[0].source).toBe('live')
    expect(res.storms[0].label).toBe('Latest from NASA')
    expect(res.storms[1].source).toBe('saved')
  })

  it('falls back to SAVED badge and saved storms when live proxy fails', async () => {
    const mockFetch: typeof fetch = async () => new Response('Server error', { status: 503 })
    const res = await loadStorms(mockFetch)
    expect(res.badge).toEqual({ kind: 'SAVED', date: gameStorms.fetchedAt.slice(0, 10) })
    expect(res.storms).toHaveLength(gameStorms.storms.length)
    expect(res.storms.every((s) => s.source === 'saved')).toBe(true)
  })

  it('falls back to SAVED badge when live proxy times out', async () => {
    const mockFetch: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })

    const res = await loadStorms(mockFetch, 20)
    expect(res.badge.kind).toBe('SAVED')
    expect(res.storms).toHaveLength(gameStorms.storms.length)
    expect(res.storms.every((s) => s.source === 'saved')).toBe(true)
  })

  it('falls back to SAVED badge when live proxy returns no storms', async () => {
    const mockFetch: typeof fetch = async () => new Response('[]', { status: 200 })
    const res = await loadStorms(mockFetch)
    expect(res.badge.kind).toBe('SAVED')
    expect(res.storms).toHaveLength(gameStorms.storms.length)
  })
})
