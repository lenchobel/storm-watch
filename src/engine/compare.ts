import type { Result, Site, TextParams } from './types'

export interface CompareRow {
  label: string
  a: string
  b: string
  labelKey: string
  aKey?: string
  aParams?: TextParams
  bKey?: string
  bParams?: TextParams
}

export interface Comparison {
  rows: CompareRow[]
  sentence: string
  textKey: string
  textParams: TextParams
}

interface WarningText {
  text: string
  key?: string
  params?: TextParams
}

function formatWarning(result: Result): WarningText {
  if (!result.clock) return { text: 'None', key: 'compare.none' }
  if (result.clock.oldMessage) return { text: 'Old news', key: 'compare.oldNews' }
  const hours = Number(result.clock.visibleHours.toFixed(1))
  return { text: `${hours}h`, key: 'compare.hours', params: { hours } }
}

function siteKey(site: Site): string {
  return site === 'mars' ? 'site.mars' : 'site.moon'
}

function siteName(site: Site): string {
  return site === 'mars' ? 'Mars' : 'Moon'
}

export function compareWorlds(
  a: { site: Site; result: Result },
  b: { site: Site; result: Result }
): Comparison {
  const warningA = formatWarning(a.result)
  const warningB = formatWarning(b.result)

  const rows: CompareRow[] = [
    {
      label: 'Stars',
      a: String(a.result.stars),
      b: String(b.result.stars),
      labelKey: 'compare.stars',
    },
    {
      label: 'Air left',
      a: String(a.result.air),
      b: String(b.result.air),
      labelKey: 'compare.airLeft',
    },
    {
      label: 'Health left',
      a: String(a.result.health),
      b: String(b.result.health),
      labelKey: 'compare.healthLeft',
    },
    {
      label: 'Science',
      a: String(a.result.science),
      b: String(b.result.science),
      labelKey: 'compare.science',
    },
    {
      label: 'Warning time',
      a: warningA.text,
      b: warningB.text,
      labelKey: 'compare.warningTime',
      aKey: warningA.key,
      aParams: warningA.params,
      bKey: warningB.key,
      bParams: warningB.params,
    },
  ]

  let sentence: string
  let textKey: string
  let textParams: TextParams

  const Ka = a.result.clock?.K ?? 1
  const Kb = b.result.clock?.K ?? 1

  if (Ka !== Kb) {
    const fewer = Ka < Kb ? a : b
    const other = Ka < Kb ? b : a
    const m = Math.abs(Ka - Kb)
    const delayFewer = fewer.result.clock?.delayMinutes ?? 0
    const delayOther = other.result.clock?.delayMinutes ?? 0
    const n = Math.round(Math.abs(delayFewer - delayOther)) || Math.round(delayFewer)
    sentence = `On ${siteName(fewer.site)} the warning came ${n} minutes late. You got ${m} fewer work blocks.`
    textKey = 'compare.kDiff'
    textParams = { site: { key: siteKey(fewer.site) }, n, m }
  } else if (a.result.clock?.oldMessage || b.result.clock?.oldMessage) {
    sentence = "Earth's message was old news on Mars."
    textKey = 'compare.oldMessage'
    textParams = {}
  } else if (Math.abs(a.result.power - b.result.power) >= 10) {
    const lowerSite = a.result.power < b.result.power ? a.site : b.site
    sentence = `${siteName(lowerSite)} gets less sunlight, so power ran lower.`
    textKey = 'compare.power'
    textParams = { site: { key: siteKey(lowerSite) } }
  } else {
    sentence = 'Both worlds felt much the same this time.'
    textKey = 'compare.same'
    textParams = {}
  }

  return { rows, sentence, textKey, textParams }
}
