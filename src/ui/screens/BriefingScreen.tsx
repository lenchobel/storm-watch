import type { Difficulty, Site, Storm } from '../../engine/types'
import { useI18n } from '../../i18n'
import { Icon } from '../components/Icon'
import { Orbi } from '../components/Orbi'
import { starGoalLines } from '../copy'

interface BriefingScreenProps {
  site: Site
  storm: Storm
  difficulty: Difficulty
  onBegin: () => void
  onChangePlan: () => void
}

export function BriefingScreen({
  site,
  storm,
  difficulty,
  onBegin,
  onChangePlan,
}: BriefingScreenProps) {
  const { t } = useI18n()
  const year = storm.flarePeak.slice(0, 4)
  const date = storm.flarePeak.slice(0, 10)
  const siteLabel = t(site === 'moon' ? 'site.moonOutpost' : 'site.marsOutpost')
  const diffLabel = t(difficulty === 'cadet' ? 'level.cadet' : 'level.commander')
  const badgeClass = storm.source === 'live' ? 'badge-live' : 'badge-saved'

  return (
    <main className="screen-stack" data-testid="briefing">
      <section className="card">
        <div className="row-between">
          <h1 className="brand-title">{siteLabel}</h1>
          <span className={`badge ${badgeClass}`}>
            {t(storm.source === 'live' ? 'badge.live' : 'badge.saved')}
          </span>
        </div>
        <p className="muted">{t('briefing.level', { level: diffLabel })}</p>

        <div className="brief-card">
          <div className="meter-head">
            <Icon name="sun" size={20} />
            <span>
              {t('briefing.flare', { class: storm.flareClass, date })}
            </span>
          </div>
          <p className="zero-margin">
            {storm.gapHours !== undefined
              ? t('briefing.particlesArrived', { hours: storm.gapHours })
              : t('briefing.noParticles')}
          </p>
        </div>

        <div className="brief-card">
          <div className="meter-head">
            <Icon name="clock" size={20} />
            <span>{t('briefing.goalTitle')}</span>
          </div>
          <p className="zero-margin">{t('briefing.survive')}</p>
          {starGoalLines(site).map((line) => (
            <p key={line.key} className="zero-margin">
              {t(line.key, line.params)}
            </p>
          ))}
          {site === 'mars' && (
            <p className="muted zero-margin">{t('briefing.marsNote')}</p>
          )}
        </div>
      </section>

      <div className="orbi-bubble">
        <Orbi mood="calm" />
        <p>{t('briefing.orbi', { year })}</p>
      </div>

      <button
        type="button"
        className="cta-btn"
        data-testid="begin-sol"
        onClick={onBegin}
      >
        {t('briefing.begin')}
      </button>
      <button type="button" className="secondary-btn" onClick={onChangePlan}>
        {t('briefing.pickAnother')}
      </button>
    </main>
  )
}
