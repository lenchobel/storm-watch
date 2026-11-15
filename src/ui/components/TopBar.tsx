import { useI18n } from '../../i18n'
import { Icon } from './Icon'

interface TopBarProps {
  title: string
  muted: boolean
  isOffline?: boolean
  onToggleMute: () => void
  onBack?: () => void
  backLabel?: string
}

export function TopBar({
  title,
  muted,
  isOffline = false,
  onToggleMute,
  onBack,
  backLabel,
}: TopBarProps) {
  const { lang, setLang, t } = useI18n()
  const back = backLabel ?? t('common.back')

  return (
    <div className="top-bar no-print">
      <div className="top-bar-left">
        {onBack && (
          <button
            type="button"
            className="compact-btn"
            onClick={onBack}
            aria-label={back}
          >
            {back}
          </button>
        )}
        <span className="h2-title">{title}</span>
        {isOffline && (
          <span className="badge badge-saved" role="status">
            {t('common.offline')}
          </span>
        )}
      </div>

      <div className="top-bar-right">
        <div className="lang-switch" role="group" aria-label={t('common.language')}>
          <button
            type="button"
            className={`lang-btn ${lang === 'en' ? 'is-selected' : ''}`}
            data-testid="lang-en"
            lang="en"
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            {t('common.english')}
          </button>
          <button
            type="button"
            className={`lang-btn ${lang === 'om' ? 'is-selected' : ''}`}
            data-testid="lang-om"
            lang="om"
            aria-pressed={lang === 'om'}
            onClick={() => setLang('om')}
          >
            {t('common.afaanOromoo')}
          </button>
        </div>

        <button
          type="button"
          className="compact-btn icon-btn"
          aria-pressed={muted}
          aria-label={muted ? t('common.unmuteSound') : t('common.muteSound')}
          onClick={onToggleMute}
        >
          <Icon name={muted ? 'speaker-off' : 'speaker'} size={20} />
        </button>
      </div>
    </div>
  )
}
