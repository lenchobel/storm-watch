import en from '../src/i18n/strings.en.json'
import om from '../src/i18n/strings.om.json'

type Catalogue = Record<string, string>

function placeholders(text: string): string[] {
  const found = text.match(/\{(\w+)\}/g) ?? []
  return [...new Set(found.map((token) => token.slice(1, -1)))].sort()
}

const english = en as Catalogue
const oromoo = om as Catalogue
const enKeys = Object.keys(english).sort()
const omKeys = Object.keys(oromoo).sort()

let failed = false

const missing = enKeys.filter((key) => !(key in oromoo))
const extra = omKeys.filter((key) => !(key in english))

if (missing.length > 0) {
  failed = true
  console.error(`Missing in strings.om.json: ${missing.join(', ')}`)
}
if (extra.length > 0) {
  failed = true
  console.error(`Not in strings.en.json: ${extra.join(', ')}`)
}

let placeholderMismatches = 0
for (const key of enKeys) {
  if (!(key in oromoo)) continue
  const enSet = placeholders(english[key]).join(',')
  const omSet = placeholders(oromoo[key]).join(',')
  if (enSet !== omSet) {
    placeholderMismatches++
    console.error(
      `Placeholders differ for "${key}": English [${enSet}] vs Afaan Oromoo [${omSet}]`
    )
  }
}
if (placeholderMismatches > 0) failed = true

const untranslated = enKeys.filter((key) => oromoo[key] === english[key]).length
const empty = omKeys.filter((key) => !oromoo[key]?.trim()).length

console.log(`English keys: ${enKeys.length}`)
console.log(`Afaan Oromoo keys: ${omKeys.length}`)
console.log(
  missing.length === 0 && extra.length === 0
    ? 'Key sets match.'
    : 'Key sets differ. See errors above.'
)
console.log(
  placeholderMismatches === 0
    ? 'Placeholders match for every shared key.'
    : `Placeholders differ on ${placeholderMismatches} keys.`
)
console.log(`Untranslated (om === en): ${untranslated}`)
console.log(`Empty Afaan Oromoo values: ${empty} (fall back to English)`)

if (failed) process.exitCode = 1
