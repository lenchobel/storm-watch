import { useMemo, useState } from 'react'
import factsData from '../../data/facts.json'
import { findSaver } from '../../engine/saver'
import type { MissionConfig, Plan, Prediction, Result } from '../../engine/types'
import { evaluateGoals } from '../../engine/goals'
import { conceptFor } from '../../engine/learning'
import { useI18n } from '../../i18n'
import { CompareCard } from '../components/CompareCard'
import { InfoNav, type InfoPageId } from '../components/InfoNav'
import { Orbi } from '../components/Orbi'
import { QuizCheck } from '../components/QuizCheck'

interface DebriefScreenProps {
  cfg: MissionConfig
  plan: Plan
  result: Result
  moonResult?: Result
  marsResult?: Result
  onTryAgain: () => void
  onFlyOtherWorld: () => void
  onPickAnother: () => void
  onOpenInfo: (page: InfoPageId) => void
  bestStars: number
  rankUp: string | null
  newBest: boolean
  prediction: Prediction | null
}

function StarIcon({ lit }: { lit: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="36"
      height="36"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z"
        fill={lit ? 'var(--amber)' : 'none'}
        stroke={lit ? 'var(--amber)' : 'var(--line)'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DebriefScreen({
  cfg,
  plan,
  result,
  moonResult,
  marsResult,
  onTryAgain,
  onFlyOtherWorld,
  onPickAnother,
  onOpenInfo,
  bestStars,
  rankUp,
  newBest,
  prediction,
}: DebriefScreenProps) {
  const { lang, t } = useI18n()
  const [shareMessage, setShareMessage] = useState('')
  const saver = useMemo(() => findSaver(cfg, plan, result), [cfg, plan, result])
  const fact = factsData[Math.abs(cfg.seed) % factsData.length]

  const saverLine =
    result.stars === 3
      ? t('debrief.perfect')
      : saver
        ? lang === 'en'
          ? saver.text
          : t(saver.textKey, saver.textParams)
        : t('debrief.hard')

  const date = cfg.storm.flarePeak.slice(0, 10)
  const siteName = t(cfg.site === 'moon' ? 'site.moonBase' : 'site.marsBase')
  const otherWorldLabel = t(cfg.site === 'moon' ? 'site.marsBase' : 'site.moonBase')

  const orbiLine = result.survived ? t('debrief.orbiWin') : t('debrief.orbiFailed')
  const goals = evaluateGoals(cfg, result)
  const concept = conceptFor(cfg, result)
  const predictionResult = prediction ? t('debrief.prediction', {
    prediction: t(`predict.${prediction}`),
    actual: t(cfg.storm.gapHours === undefined ? 'predict.didNot' : 'predict.came'),
  }) : null
  const shareChallenge = async () => {
    const url = new URL(window.location.href)
    url.search = new URLSearchParams({
      storm: cfg.storm.id,
      site: cfg.site,
      difficulty: cfg.difficulty,
      seed: String(cfg.seed),
      beat: String(result.stars),
    }).toString()
    try {
      const base = t(cfg.site === 'moon' ? 'site.moonBase' : 'site.marsBase')
      const shareText = t('debrief.shareText', { n: result.stars, base })
      if (navigator.share) await navigator.share({ title: t('debrief.challenge'), text: shareText, url: url.toString() })
      else {
        await navigator.clipboard.writeText(url.toString())
        setShareMessage(t('debrief.copied'))
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url.toString())
        setShareMessage(t('debrief.copied'))
      } catch {
        setShareMessage(url.toString())
      }
    }
  }

  return (
    <main className="screen-stack" data-testid="debrief">
      <section className="card debrief-head">
        <div
          className="star-row stars-pop"
          role="img"
          aria-label={t('debrief.stars', { n: result.stars })}
        >
          {[1, 2, 3].map((n) => (
            <StarIcon key={n} lit={n <= result.stars} />
          ))}
        </div>
        <h1 className="brand-title">
          {result.survived
            ? t('debrief.complete')
            : t('debrief.failedTitle', { sol: result.endedOnSol })}
        </h1>
        <div className="row-between">
          <span>
            {t('debrief.stormMeta', {
              site: siteName,
              class: cfg.storm.flareClass,
              date,
            })}
          </span>
          <span
            className={`badge ${cfg.storm.source === 'live' ? 'badge-live' : 'badge-saved'}`}
          >
            {t(cfg.storm.source === 'live' ? 'badge.live' : 'badge.saved')}
          </span>
        </div>

        <div className="summary-grid">
          <div className="stat-box">
            <span className="muted">{t('meter.air')}</span>
            <strong>{result.air}</strong>
          </div>
          <div className="stat-box">
            <span className="muted">{t('meter.health')}</span>
            <strong>{result.health}</strong>
          </div>
          <div className="stat-box">
            <span className="muted">{t('meter.science')}</span>
            <strong>{result.science}</strong>
          </div>
        </div>
      </section>

      {predictionResult && <section className="card"><p className="zero-margin">{predictionResult}</p></section>}
      {concept && <section className="card" aria-label={t('learn.title')}>
        <h2 className="h2-title">{t('learn.title')}</h2>
        <p className="zero-margin">{t(`learn.${concept}`)}</p>
        <h3 className="h2-title">{t('learn.talk')}</h3>
        <p className="zero-margin">{t(`learn.ask.${concept}`)}</p>
      </section>}

      <section className="card" aria-label={t('debrief.goals')}>
        <div className="row-between"><h2 className="h2-title">{t('debrief.goals')}</h2><span>{t('debrief.bestStars', { n: bestStars })}</span></div>
        {newBest && <p className="rank-up">{t('debrief.newBest')}</p>}
        {rankUp && <p className="rank-up">{t('debrief.rankUp', { rank: t(`rank.${rankUp}`) })}</p>}
        {goals.map((goal) => <p className="zero-margin" key={goal.id}>{goal.done ? '✓' : '□'} {t(`goal.${goal.id}`)}</p>)}
      </section>

      <div className="orbi-bubble">
        <Orbi mood={result.survived ? 'calm' : 'worried'} />
        <p className="zero-margin">{orbiLine}</p>
      </div>

      <section className="card" aria-label={t('debrief.saverTitle')}>
        <h2 className="h2-title">{t('debrief.saverTitle')}</h2>
        <p data-testid="saver-text" className="zero-margin">
          {saverLine}
        </p>
      </section>

      {moonResult && marsResult && (
        <CompareCard moon={moonResult} mars={marsResult} />
      )}

      <section className="card" aria-label={t('debrief.factSection')}>
        <h2 className="h2-title">{t('debrief.factTitle')}</h2>
        <p>{t(`fact.${fact.id}.text`)}</p>
        <p className="muted zero-margin">
          {t('debrief.source')}{' '}
          <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
            {t(`fact.${fact.id}.source`)}
          </a>
        </p>
      </section>

      <QuizCheck />

      <button type="button" className="secondary-btn" onClick={() => void shareChallenge()}>{t('debrief.share')}</button>
      {shareMessage && <p role="status">{shareMessage}</p>}

      <div className="controls-stack">
        <button
          type="button"
          className="cta-btn"
          data-testid="fly-other"
          onClick={onFlyOtherWorld}
        >
          {t('debrief.flyOther', { site: otherWorldLabel })}
        </button>
        <button
          type="button"
          className="secondary-btn"
          data-testid="try-again"
          onClick={onTryAgain}
        >
          {t('debrief.tryAgain')}
        </button>
        <button
          type="button"
          className="secondary-btn"
          data-testid="pick-another"
          onClick={onPickAnother}
        >
          {t('briefing.pickAnother')}
        </button>
      </div>

      <InfoNav onOpen={onOpenInfo} />
    </main>
  )
}
