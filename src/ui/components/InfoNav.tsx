import { useI18n } from '../../i18n'

export type InfoPageId =
  | 'sources'
  | 'simplified'
  | 'glossary'
  | 'teacher'
  | 'about'

interface InfoNavProps {
  onOpen: (page: InfoPageId) => void
}

const PAGES: Array<{ id: InfoPageId; labelKey: string }> = [
  { id: 'sources', labelKey: 'info.nav.sources' },
  { id: 'simplified', labelKey: 'info.nav.simplified' },
  { id: 'glossary', labelKey: 'info.nav.glossary' },
  { id: 'teacher', labelKey: 'info.nav.teacher' },
  { id: 'about', labelKey: 'info.nav.about' },
]

export function InfoNav({ onOpen }: InfoNavProps) {
  const { t } = useI18n()

  return (
    <nav className="nav-strip no-print" aria-label={t('info.navLabel')}>
      {PAGES.map((p) => (
        <button
          key={p.id}
          type="button"
          className="nav-btn"
          data-testid={`info-nav-${p.id}`}
          onClick={() => onOpen(p.id)}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </nav>
  )
}
