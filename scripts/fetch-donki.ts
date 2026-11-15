import fs from 'node:fs'
import path from 'node:path'
import { linkStorms, type DonkiFlare, type DonkiSep } from '../src/data/donkiLink'
import type { Storm } from '../src/engine/types'

const DONKI_BASE = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get'
const TIMEOUT_MS = 8000
const RETRIES = 2

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchWithRetry<T>(url: string): Promise<T[]> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 503 || res.status === 429 || !res.ok) {
        if (attempt < RETRIES) {
          await sleep(1000 * (attempt + 1))
          continue
        }
        throw new Error(`HTTP ${res.status} for ${url}`)
      }
      const data = (await res.json()) as unknown
      return Array.isArray(data) ? (data as T[]) : []
    } catch (err) {
      clearTimeout(timer)
      if (attempt < RETRIES) {
        await sleep(1000 * (attempt + 1))
        continue
      }
      throw err
    }
  }
  return []
}

function buildChunks(startIso: string, endIso: string, maxDays = 55): Array<[string, string]> {
  const chunks: Array<[string, string]> = []
  let cur = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(`${endIso}T00:00:00Z`)
  while (cur <= end) {
    const chunkEnd = new Date(cur.getTime() + (maxDays - 1) * 86400_000)
    const clampedEnd = chunkEnd > end ? end : chunkEnd
    chunks.push([cur.toISOString().slice(0, 10), clampedEnd.toISOString().slice(0, 10)])
    cur = new Date(clampedEnd.getTime() + 86400_000)
  }
  return chunks
}

async function fetchRange(startDate: string, endDate: string) {
  const flrUrl = `${DONKI_BASE}/FLR?startDate=${startDate}&endDate=${endDate}`
  const sepUrl = `${DONKI_BASE}/SEP?startDate=${startDate}&endDate=${endDate}`
  const flares = await fetchWithRetry<DonkiFlare>(flrUrl)
  await sleep(150)
  const seps = await fetchWithRetry<DonkiSep>(sepUrl)
  return { flares, seps }
}

async function main() {
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 3 * 365 * 86400_000).toISOString().slice(0, 10)
  const chunks = buildChunks(startDate, endDate, 55)

  const flareMap = new Map<string, DonkiFlare>()
  const sepMap = new Map<string, DonkiSep>()

  console.log(`Fetching DONKI in ${chunks.length} chunks (${startDate} to ${endDate})...`)
  for (const [start, end] of chunks) {
    const { flares, seps } = await fetchRange(start, end)
    for (const f of flares) flareMap.set(f.flrID, f)
    for (const s of seps) sepMap.set(s.sepID, s)
    await sleep(150)
  }

  let allFlares = Array.from(flareMap.values())
  let allSeps = Array.from(sepMap.values())
  let storms = linkStorms(allFlares, allSeps, 'saved')
  let linked = storms.filter((s) => s.gapHours !== undefined)

  if (linked.length < 3) {
    console.log('Fewer than 3 usable particle storms found; widening to 2012-present...')
    const widerChunks = buildChunks('2012-01-01', startDate, 55)
    for (const [start, end] of widerChunks) {
      const { flares, seps } = await fetchRange(start, end)
      for (const f of flares) flareMap.set(f.flrID, f)
      for (const s of seps) sepMap.set(s.sepID, s)
      await sleep(150)
    }
    allFlares = Array.from(flareMap.values())
    allSeps = Array.from(sepMap.values())
    storms = linkStorms(allFlares, allSeps, 'saved')
    linked = storms.filter((s) => s.gapHours !== undefined)
  }

  console.log(`Flares: ${allFlares.length}, SEPs: ${allSeps.length}, Linked particle storms (0.25..48h): ${linked.length}`)
  if (linked.length < 3) {
    console.error('ERROR: Fewer than 3 particle storms found in DONKI. Stopping without inventing data.')
    process.exit(1)
  }

  const falseAlarms = storms
    .filter((s) => s.gapHours === undefined && /^[MX]/i.test(s.flareClass))
    .slice(0, 30)

  const combined: Storm[] = [...linked, ...falseAlarms]
  const payload = {
    fetchedAt: new Date().toISOString(),
    source: 'NASA DONKI',
    storms: combined,
  }

  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
  fs.mkdirSync(path.join(process.cwd(), 'src', 'data'), { recursive: true })
  fs.writeFileSync(path.join(process.cwd(), 'data', 'storms.json'), JSON.stringify(payload, null, 2))
  fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'storms.json'), JSON.stringify(payload, null, 2))
  console.log(`Saved ${combined.length} storms (${linked.length} linked, ${falseAlarms.length} false alarms)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
