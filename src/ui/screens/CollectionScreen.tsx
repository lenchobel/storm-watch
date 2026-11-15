import type { Site, Storm } from '../../engine/types'
import { useI18n } from '../../i18n'
import { bestStarsKey, type Progress } from '../progress'
import { Icon } from '../components/Icon'

export function CollectionScreen({ storms, progress, onBack }: { storms: Storm[]; progress: Progress; onBack: () => void }) {
  const { t } = useI18n()
  const best = (stormId: string, site: Site) => Math.max(
    progress.bestStars[bestStarsKey(stormId, site, 'cadet')] ?? 0,
    progress.bestStars[bestStarsKey(stormId, site, 'commander')] ?? 0
  )
  return <main className="screen-stack collection-screen" data-testid="collection">
    <section className="card">
      <h1 className="brand-title">{t('collection.title')}</h1>
      <p className="muted">{t('collection.forecaster', { right: progress.forecaster.right, guesses: progress.forecaster.guesses })}</p>
      <p className="muted">{t('collection.forecastNote')}</p>
      {storms.map((storm) => {
        const unlocked = progress.runs.some((run) => run.stormId === storm.id)
        const date = storm.flarePeak.slice(0, 10)
        return <article className={`brief-card collection-card ${unlocked ? '' : 'is-locked'}`} key={storm.id}>
          <div className="row-between">
            {unlocked ? <><Icon name="sun" size={22}/><strong className="flare-badge">{storm.flareClass}</strong><span className={`badge ${storm.source === 'live' ? 'badge-live' : 'badge-saved'}`}>{t(storm.source === 'live' ? 'badge.live' : 'badge.saved')}</span></> : <Icon name="lock" size={22}/>}
          </div>
          <p className="zero-margin">{date}</p>
          {unlocked && <>
            <p className="zero-margin">{storm.gapHours === undefined ? t('collection.falseAlarm') : t('collection.gap', { hours: storm.gapHours })}</p>
            <p className="zero-margin">{t('collection.bestMoon', { n: best(storm.id, 'moon') })}</p>
            <p className="zero-margin">{t('collection.bestMars', { n: best(storm.id, 'mars') })}</p>
          </>}
        </article>
      })}
    </section>
    <button type="button" className="cta-btn" onClick={onBack}>{t('info.back')}</button>
  </main>
}
