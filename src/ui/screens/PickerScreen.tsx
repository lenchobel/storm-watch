import type { StormBadge } from '../../data/loadStorms'
import type { Difficulty, Site, Storm } from '../../engine/types'
import { useI18n } from '../../i18n'
import { Icon } from '../components/Icon'
import { InfoNav, type InfoPageId } from '../components/InfoNav'
import { Orbi } from '../components/Orbi'
import { TriLine } from '../components/TriLine'

interface PickerScreenProps {
  storms: Storm[]
  badge: StormBadge
  site: Site
  stormId: string
  difficulty: Difficulty
  canInstall: boolean
  onInstallApp: () => void
  onSelectSite: (site: Site) => void
  onSelectStorm: (id: string) => void
  onSelectDifficulty: (diff: Difficulty) => void
  onStart: () => void
  onOpenInfo: (page: InfoPageId) => void
}

export function PickerScreen({
  storms,
  badge,
  site,
  stormId,
  difficulty,
  canInstall,
  onInstallApp,
  onSelectSite,
  onSelectStorm,
  onSelectDifficulty,
  onStart,
  onOpenInfo,
}: PickerScreenProps) {
  const { lang, t } = useI18n()

  return (
    <main className="screen-stack picker-screen" data-testid="picker">
      <div className="hero-header">
        <Orbi mood="calm" status="calm" />
        <div>
          <h1 className="brand-title">{t('app.name')}</h1>
          <TriLine title />
          <p className="muted zero-margin">{t('app.tagline')}</p>
        </div>
      </div>

      <section className="card" aria-label={t('picker.worldSection')}>
        <h2 className="h2-title">{t('picker.worldTitle')}</h2>
        <div className="toggle-row">
          <button
            type="button"
            className={site === 'moon' ? 'is-selected' : ''}
            aria-pressed={site === 'moon'}
            onClick={() => onSelectSite('moon')}
          >
            <Icon name="house" size={18} filled={site === 'moon'} />
            <span className="site-btn-text">
              <span>{t('site.moon')}</span>
              <span className="site-btn-base">{t('site.moonBase')}</span>
            </span>
          </button>
          <button
            type="button"
            className={site === 'mars' ? 'is-selected' : ''}
            aria-pressed={site === 'mars'}
            onClick={() => onSelectSite('mars')}
          >
            <Icon name="sun" size={18} />
            <span className="site-btn-text">
              <span>{t('site.mars')}</span>
              <span className="site-btn-base">{t('site.marsBase')}</span>
            </span>
          </button>
        </div>
      </section>

      <section className="card" aria-label={t('picker.stormSection')}>
        <div className="row-between">
          <h2 className="h2-title">{t('picker.stormTitle')}</h2>
          <span
            className={`badge ${badge.kind === 'LIVE' ? 'badge-live' : 'badge-saved'}`}
          >
            {t(badge.kind === 'LIVE' ? 'badge.live' : 'badge.saved')} {badge.date}
          </span>
        </div>
        <div className="storm-list">
          {storms.map((storm) => {
            const selected = storm.id === stormId
            const date = storm.flarePeak.slice(0, 10)
            const detail = storm.gapHours !== undefined
              ? t('picker.stormDetail', { hours: storm.gapHours })
              : t('picker.falseAlarm')
            const stormBadge =
              storm.labelKey && lang !== 'en'
                ? t(storm.labelKey)
                : storm.label ??
                  t(storm.source === 'live' ? 'badge.live' : 'badge.saved')
            return (
              <button
                key={storm.id}
                type="button"
                className={`storm-btn ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelectStorm(storm.id)}
              >
                <span className="storm-main">
                  <strong>
                    {storm.flareClass} ({date})
                  </strong>
                  <span>{detail}</span>
                </span>
                <span
                  className={`badge ${storm.source === 'live' ? 'badge-live' : 'badge-saved'}`}
                >
                  {stormBadge}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card" aria-label={t('picker.levelSection')}>
        <h2 className="h2-title">{t('picker.levelTitle')}</h2>
        <div className="toggle-row">
          <button
            type="button"
            className={difficulty === 'cadet' ? 'is-selected' : ''}
            aria-pressed={difficulty === 'cadet'}
            onClick={() => onSelectDifficulty('cadet')}
          >
            {t('picker.cadet')}
          </button>
          <button
            type="button"
            className={difficulty === 'commander' ? 'is-selected' : ''}
            aria-pressed={difficulty === 'commander'}
            onClick={() => onSelectDifficulty('commander')}
          >
            {t('picker.commander')}
          </button>
        </div>
      </section>

      <button
        type="button"
        className="cta-btn"
        data-testid="start-mission"
        onClick={onStart}
      >
        {t('picker.start')}
      </button>

      {canInstall && (
        <button type="button" className="secondary-btn" onClick={onInstallApp}>
          {t('picker.install')}
        </button>
      )}

      <InfoNav onOpen={onOpenInfo} />
    </main>
  )
}
