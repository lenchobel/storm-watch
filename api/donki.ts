interface ApiRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
}

interface ApiResponse {
  status: (code: number) => ApiResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
}

interface CacheEntry {
  expiresAt: number
  data: unknown
}

const CACHE_TTL_MS = 60 * 60 * 1000
const TIMEOUT_MS = 8000
const DONKI_BASE = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const cache = new Map<string, CacheEntry>()

function pickParam(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] ?? '' : val ?? ''
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const type = pickParam(req.query?.type).toUpperCase()
  const start = pickParam(req.query?.start)
  const end = pickParam(req.query?.end)

  if (type !== 'FLR' && type !== 'SEP') {
    res.status(400).json({ error: 'Invalid type; expected FLR or SEP' })
    return
  }
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    res.status(400).json({ error: 'Invalid start or end date; expected YYYY-MM-DD' })
    return
  }

  const cacheKey = `${type}:${start}:${end}`
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.status(200).json(cached.data)
    return
  }

  const apiKey = process.env.NASA_API_KEY
  const url = `${DONKI_BASE}/${type}?startDate=${start}&endDate=${end}`
  const headers: Record<string, string> = apiKey ? { 'X-Api-Key': apiKey } : {}

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const upstream = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timer)
    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream DONKI error (${upstream.status})` })
      return
    }
    const data = await upstream.json()
    cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.status(200).json(data)
  } catch {
    clearTimeout(timer)
    res.status(504).json({ error: 'DONKI request timed out or failed' })
  }
}
