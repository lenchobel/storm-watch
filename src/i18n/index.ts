import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { TextParams } from '../engine/types'
import { translate, type Language } from './translate'

const STORAGE_KEY = 'stormwatch.language'

export interface I18nValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, vars?: TextParams) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'om') return saved
    } catch {
      // Private mode can block storage. Fall through to the browser language.
    }
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return nav.toLowerCase().startsWith('om') ? 'om' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The language still changes for this session.
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: TextParams) => translate(lang, key, vars),
    [lang]
  )

  useEffect(() => {
    document.documentElement.lang = lang === 'om' ? 'om' : 'en'
    document.title = translate(lang, 'app.name')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translate(lang, 'app.metaDescription'))
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', translate(lang, 'app.name'))
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', translate(lang, 'app.ogDescription'))
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n needs a LanguageProvider')
  return value
}

export type { Language } from './translate'
export { translate } from './translate'
