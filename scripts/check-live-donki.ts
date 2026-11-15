import handler from '../api/donki'
import { linkStorms } from '../src/data/donkiLink'
import type { DonkiFlare, DonkiSep } from '../src/data/donkiLink'

/**
 * Exercises the real live path end to end: the Vercel proxy in api/donki.ts
 * against the live NASA CCMC DONKI API, then the same linking the app uses.
 * Prints the badge the browser would show.
 */
const LIVE_WINDOW_DAYS = 55

interface ProxyResult {
  status: number
  body: unknown
}

function callProxy(type: 'FLR' | 'SEP', start: string, end: string): Promise<ProxyResult> {
  return new Promise((resolve) => {
    let status = 0
    let body: unknown = null
    const res = {
      status(code: number) {
        status = code
        return res
      },
      setHeader() {
        return res
      },
      json(b: unknown) {
        body = b
        resolve({ status, body })
        return res
      },
    }
    handler({ method: 'GET', query: { type, start, end } }, res)
  })
}

async function main() {
  const end = new Date()
  const start = new Date(end.getTime() - LIVE_WINDOW_DAYS * 86400_000)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  console.log('=== Live DONKI path check (proxy -> ccmc.gsfc.nasa.gov) ===')
  console.log(`window: ${startStr} .. ${endStr} (${LIVE_WINDOW_DAYS} days)`)
  console.log('')

  const flares = await callProxy('FLR', startStr, endStr)
  const seps = await callProxy('SEP', startStr, endStr)

  console.log(`proxy FLR -> HTTP ${flares.status}, ${Array.isArray(flares.body) ? flares.body.length : 0} events`)
  console.log(`proxy SEP -> HTTP ${seps.status}, ${Array.isArray(seps.body) ? seps.body.length : 0} events`)
  console.log('')

  if (!Array.isArray(flares.body) || !Array.isArray(seps.body)) {
    console.log('result: FAIL - the proxy did not return JSON arrays')
    process.exitCode = 1
    return
  }

  const linked = linkStorms(flares.body as DonkiFlare[], seps.body as DonkiSep[], 'live')
  console.log(`linked live storms: ${linked.length}`)
  const particle = linked.filter((s) => s.sepStart)
  console.log(`  with particles: ${particle.length}`)
  console.log(`  false alarms  : ${linked.length - particle.length}`)
  console.log('')

  if (linked.length === 0) {
    console.log('badge the browser would show: SAVED (no live storms in the window)')
    return
  }

  const newest = [...linked].sort(
    (a, b) => Date.parse(b.flarePeak) - Date.parse(a.flarePeak)
  )[0]
  console.log('newest live storm:')
  console.log(`  id        ${newest.id}`)
  console.log(`  class     ${newest.flareClass}`)
  console.log(`  peak      ${newest.flarePeak}`)
  console.log(`  particles ${newest.sepStart ?? 'none (false alarm)'}`)
  console.log(`  gap       ${newest.gapHours ?? 'none'} h`)
  console.log(`  tier      ${newest.tier}`)
  console.log('')
  console.log(
    `badge the browser would show: LIVE ${newest.flarePeak.slice(0, 10)}`
  )
}

void main()
