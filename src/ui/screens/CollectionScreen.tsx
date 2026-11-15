import type { Site, Storm } from '../../engine/types'
import { useI18n } from '../../i18n'
import { bestStarsKey, type Progress } from '../progress'

export function CollectionScreen({ storms, progress, onBack }: { storms: Storm[]; progress: Progress; onBack: () => void }) {
  const { t } = useI18n()
  const best = (stormId: string, site: Site) => Math.max(
    progress.bestStars[bestStarsKey(stormId, site, 'cadet')] ?? 0,
    progress.bestStars[bestStarsKey(stormId, site, 'commander')] ?? 0
  )
  return <main className="screen-stack" data-testid="collection">
    <section className="card">
      <h1 className="brand-title">{t('collection.title')}</h1>
      <p className="muted">{t('collection.forecaster', { right: progress.forecaster.right, guesses: progress.forecaster.guesses })}</p>
      <p className="muted">{t('collection.forecastNote')}</p>
      {storms.map((storm) => {
        const unlocked = progress.runs.some((run) => run.stormId === storm.id)
        const date = storm.flarePeak.slice(0, 10)
        return <article className="brief-card" key={storm.id}>
          <div className="row-between">
            <strong>{unlocked ? `${storm.flareClass} · ${date}` : date}</strong>
            {unlocked && <span className={`badge ${storm.source === 'live' ? 'badge-live' : 'badge-saved'}`}>{t(storm.source === 'live' ? 'badge.live' : 'badge.saved')}</span>}
          </div>
          {unlocked ? <>
            <p>{t('collection.flare', { class: storm.flareClass, date })}</p>
            <p>{storm.gapHours === undefined ? t('collection.falseAlarm') : t('collection.gap', { hours: storm.gapHours })}</p>
            <p>{t('picker.collectionBest', { moon: best(storm.id, 'moon'), mars: best(storm.id, 'mars') })}</p>
          </> : <p>{t('collection.locked')}</p>}
        </article>
      })}
    </section>
    <button type="button" className="cta-btn" onClick={onBack}>{t('info.back')}</button>
  </main>
}
