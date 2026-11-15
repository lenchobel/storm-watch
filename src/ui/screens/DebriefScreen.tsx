import { useMemo } from 'react'
import factsData from '../../data/facts.json'
import { TOTAL_SOLS } from '../../engine/rules'
import { findSaver } from '../../engine/saver'
import type { MissionConfig, Plan, Result } from '../../engine/types'
import { useI18n } from '../../i18n'
import { CompareCard } from '../components/CompareCard'
import { InfoNav, type InfoPageId } from '../components/InfoNav'
import { Orbi } from '../components/Orbi'
import { QuizCheck } from '../components/QuizCheck'
import { starGoalLine } from '../copy'

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
}: DebriefScreenProps) {
  const { lang, t } = useI18n()
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
  const siteName = t(cfg.site === 'moon' ? 'site.moon' : 'site.mars')
  const otherWorldLabel = t(cfg.site === 'moon' ? 'site.mars' : 'site.moon')
  const goal = starGoalLine(cfg.site)

  const orbiLines = [
    result.survived
      ? t('debrief.survived', { site: siteName, n: TOTAL_SOLS })
      : t('debrief.failed', { site: siteName, sol: result.endedOnSol }),
    t('debrief.healthAir', { health: result.health, air: result.air }),
    t('debrief.sciencePower', { science: result.science, power: result.power }),
    t(goal.key, goal.params),
  ]

  return (
    <main className="screen-stack" data-testid="debrief">
      <section className="card debrief-head">
        <div
          className="star-row"
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

      <div className="orbi-bubble">
        <Orbi mood={result.survived ? 'calm' : 'worried'} />
        <div>
          {orbiLines.map((line, i) => (
            <p key={i} className="zero-margin">
              {line}
            </p>
          ))}
        </div>
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
