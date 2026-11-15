import enStrings from './strings.en.json'
import omStrings from './strings.om.json'
import type { TextParam, TextParams } from '../engine/types'

export type Language = 'en' | 'om'

const EN = enStrings as Record<string, string>
const OM = omStrings as Record<string, string>

function pick(lang: Language, key: string): string | undefined {
  const table = lang === 'om' ? OM : EN
  const value = table[key]
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/** Look up one string. A missing or empty om value falls back to English. */
export function getText(lang: Language, key: string): string {
  return pick(lang, key) ?? pick('en', key) ?? key
}

function resolveValue(lang: Language, value: TextParam): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return translate(lang, value.key, value.params)
}

/** Fill {placeholders} in one string. Nested keys keep pieces translatable. */
export function translate(
  lang: Language,
  key: string,
  params?: TextParams
): string {
  const template = getText(lang, key)
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : resolveValue(lang, value)
  })
}
