import { useState } from 'react'
import { useI18n } from '../../i18n'
import { Icon } from './Icon'

interface TopBarProps {
  title: string
  muted: boolean
  isOffline?: boolean
  onToggleMute: () => void
  onBack?: () => void
  backLabel?: string
  vibration?: boolean
  onToggleVibration?: () => void
  simpleView?: boolean
  onToggleSimpleView?: () => void
  onClearProgress?: () => void
}

export function TopBar({
  title,
  muted,
  isOffline = false,
  onToggleMute,
  onBack,
  backLabel,
  vibration = false,
  onToggleVibration = () => {},
  simpleView = false,
  onToggleSimpleView = () => {},
  onClearProgress = () => {},
}: TopBarProps) {
  const { lang, setLang, t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const back = backLabel ?? t('common.backButton')

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
            EN
          </button>
          <button
            type="button"
            className={`lang-btn ${lang === 'om' ? 'is-selected' : ''}`}
            data-testid="lang-om"
            lang="om"
            aria-pressed={lang === 'om'}
            onClick={() => setLang('om')}
          >
            OM
          </button>
        </div>

        <button type="button" className="compact-btn icon-btn" aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 5v-2l-2.1-.7a7 7 0 0 0-.7-1.7l1-2-1.4-1.4-2 1a7 7 0 0 0-1.7-.7L13.5 3h-2l-.7 2.1a7 7 0 0 0-1.7.7l-2-1-1.4 1.4 1 2a7 7 0 0 0-.7 1.7L4 11v2l2.1.7a7 7 0 0 0 .7 1.7l-1 2 1.4 1.4 2-1a7 7 0 0 0 1.7.7l.7 2.1h2l.7-2.1a7 7 0 0 0 1.7-.7l2 1 1.4-1.4-1-2a7 7 0 0 0 .7-1.7L21 13Z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      </div>
      {settingsOpen && <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
        <section className="settings-sheet card" role="dialog" aria-modal="true" aria-label={t('settings.title')}>
          <div className="row-between"><h2 className="h2-title">{t('settings.title')}</h2><button type="button" aria-label={t('common.close')} onClick={() => setSettingsOpen(false)}>×</button></div>
          <button type="button" aria-pressed={muted} onClick={onToggleMute}><Icon name={muted ? 'speaker-off' : 'speaker'} />{muted ? t('common.unmuteSound') : t('common.muteSound')}</button>
          <button type="button" aria-pressed={!vibration} onClick={onToggleVibration}>{t('settings.vibration')}</button>
          <button type="button" aria-pressed={simpleView} onClick={onToggleSimpleView}>{t('settings.simpleView')}</button>
          <button type="button" onClick={onClearProgress}>{t('settings.clearProgress')}</button>
        </section>
      </div>}
    </div>
  )
}
