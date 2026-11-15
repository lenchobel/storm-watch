import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import facts from '../src/data/facts.json'
import { FACT_QUOTES } from './fact-quotes'

interface Fact {
  id: string
  text: string
  sourceName: string
  sourceUrl: string
  dateChecked: string
}

const TIMEOUT_MS = 45_000

function rebuildPdfStream(s: string): string {
  const cleaned = s.replace(/\)\s*-?\d+\s*\(/g, ')(')
  const parts = cleaned.match(/\((?:\\.|[^\\()])*\)/g) || []
  return parts
    .map((p) => p.slice(1, -1))
    .join('')
    .replace(/\\([()\\])/g, '$1')
}

/** Plain text for PDFs whose content streams hold literal strings. */
function pdfText(buf: Buffer): string {
  const raw = buf.toString('latin1')
  const chunks: string[] = []
  let idx = 0
  while (true) {
    const s = raw.indexOf('stream', idx)
    if (s === -1) break
    let start = s + 6
    if (raw[start] === '\r') start++
    if (raw[start] === '\n') start++
    const e = raw.indexOf('endstream', start)
    if (e === -1) break
    try {
      chunks.push(inflateSync(buf.subarray(start, e)).toString('latin1'))
    } catch {
      /* not a flate stream */
    }
    idx = e + 9
  }
  return chunks.map(rebuildPdfStream).filter((t) => t.length > 40).join('\n')
}

function htmlText(body: string): string {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

function sentenceAround(text: string, index: number): string {
  const window = 320
  const start = Math.max(0, index - window)
  const slice = text.slice(start, index + window)
  const rel = index - start
  const before = slice.slice(0, rel)
  const after = slice.slice(rel)
  const cut = before.lastIndexOf('. ')
  const head = cut === -1 ? before : before.slice(cut + 2)
  const stop = after.search(/[.!?]\s/)
  const tail = stop === -1 ? after : after.slice(0, stop + 1)
  return `${head}${tail}`.replace(/\s+/g, ' ').trim()
}

async function check(fact: Fact) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(fact.sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'storm-watch-fact-check/1.0' },
    })
    const type = res.headers.get('content-type') ?? ''
    const buf = Buffer.from(await res.arrayBuffer())
    const sha256 = createHash('sha256').update(buf).digest('hex')
    const text = type.includes('pdf') ? pdfText(buf) : htmlText(buf.toString('utf8'))
    return { status: res.status, type, bytes: buf.length, sha256, text }
  } finally {
    clearTimeout(timer)
  }
}

console.log('=== Storm Watch fact check: every src/data/facts.json URL ===')
console.log('')

let failures = 0

for (const fact of facts as Fact[]) {
  const recorded = FACT_QUOTES.find((q) => q.id === fact.id)
  console.log(`--- ${fact.id} ---`)
  console.log(`fact    : ${fact.text}`)
  console.log(`source  : ${fact.sourceName}`)
  console.log(`url     : ${fact.sourceUrl}`)

  if (!recorded) {
    failures++
    console.log('result  : FAIL - no recorded source quote for this fact')
    console.log('')
    continue
  }

  try {
    const { status, type, bytes, sha256, text } = await check(fact)
    console.log(`fetch   : HTTP ${status} | ${type} | ${bytes} bytes`)
    console.log(`sha256  : ${sha256}`)
    console.log(`where   : ${recorded.where}`)

    if (sha256 !== recorded.sha256) {
      failures++
      console.log('result  : FAIL - the live file changed since the quote was recorded')
      console.log('')
      continue
    }
    console.log('hash    : matches the copy the quote was read from')

    if (recorded.liveSearch) {
      const match = recorded.liveSearch.exec(text)
      if (!match) {
        failures++
        console.log('result  : FAIL - the number was not found in the live text')
        console.log('')
        continue
      }
      console.log(`live    : "${sentenceAround(text, match.index)}"`)
    }

    for (const quote of recorded.quotes) {
      console.log(`quote   : "${quote}"`)
    }
    console.log('result  : PASS')
  } catch (err) {
    failures++
    console.log(`result  : FAIL - ${String(err)}`)
  }
  console.log('')
}

console.log(`checked ${(facts as Fact[]).length} facts, ${failures} failed`)
if (failures > 0) process.exitCode = 1
