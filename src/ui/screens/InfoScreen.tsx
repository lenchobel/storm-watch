import { useState } from 'react'
import type { StormBadge } from '../../data/loadStorms'
import type { MissionConfig } from '../../engine/types'
import factsData from '../../data/facts.json'
import { useI18n } from '../../i18n'
import { GLOSSARY, SIMPLIFIED_POINTS, TEACHER_PLAN } from '../copy'
import type { InfoPageId } from '../components/InfoNav'
import { SimpleViewToggle } from '../components/SimpleViewToggle'
import { Icon } from '../components/Icon'

function InfoTitle({ children }: { children: string }) {
  return <h1 className="brand-title info-title"><Icon name="book" size={24}/>{children}</h1>
}

interface InfoScreenProps {
  page: InfoPageId
  badge: StormBadge
  onSelectPage: (page: InfoPageId) => void
  onClose: () => void
  vibration: boolean
  onToggleVibration: () => void
  onClearProgress: () => void
  classroomMode: boolean
  onToggleClassroom: () => void
  daily: MissionConfig
  simpleView: boolean
  onToggleSimpleView: () => void
}

export function InfoScreen({
  page,
  badge,
  onSelectPage,
  onClose,
  vibration,
  onToggleVibration,
  onClearProgress,
  classroomMode,
  onToggleClassroom,
  daily,
  simpleView,
  onToggleSimpleView,
}: InfoScreenProps) {
  const { t } = useI18n()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <main className="screen-stack" data-testid="info">
      {page === 'sources' && (
        <section className="card">
          <InfoTitle>{t('info.sources.title')}</InfoTitle>
          <p>{t('info.sources.intro')}</p>
          <p>
            {t('info.sources.status')}{' '}
            <span
              className={`badge ${badge.kind === 'LIVE' ? 'badge-live' : 'badge-saved'}`}
            >
              {t(badge.kind === 'LIVE' ? 'badge.live' : 'badge.saved')} {badge.date}
            </span>
          </p>
          <ul className="info-list">
            {factsData.map((item) => (
              <li key={item.id}>
                <p className="zero-margin">{t(`fact.${item.id}.text`)}</p>
                <p className="muted zero-margin">
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    {t(`fact.${item.id}.source`)}
                  </a>{' '}
                  {t('info.sources.checked', { date: item.dateChecked })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page === 'simplified' && (
        <section className="card">
          <InfoTitle>{t('info.simplified.title')}</InfoTitle>
          <ul className="info-list">
            {SIMPLIFIED_POINTS.map((pointKey) => (
              <li key={pointKey}>{t(pointKey)}</li>
            ))}
          </ul>
        </section>
      )}

      {page === 'glossary' && (
        <section className="card">
          <InfoTitle>{t('info.glossary.title')}</InfoTitle>
          <dl className="glossary-list">
            {GLOSSARY.map((entry) => (
              <div key={entry.termKey} className="glossary-row">
                <dt>
                  <strong>{t(entry.termKey)}</strong>
                </dt>
                <dd className="muted">{t(entry.definitionKey)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {page === 'teacher' && (
        <section className="card teacher-plan">
          <InfoTitle>{t(TEACHER_PLAN.titleKey)}</InfoTitle>
          <p>{t(TEACHER_PLAN.goalKey)}</p>
          <p>{t('teacher.bases')}</p>
          <h2 className="h2-title">{t(TEACHER_PLAN.activityTitleKey)}</h2>
          <ol className="info-list">
            {TEACHER_PLAN.activityKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
          <h2 className="h2-title">{t(TEACHER_PLAN.questionsTitleKey)}</h2>
          <ol className="info-list">
            {TEACHER_PLAN.questionKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
          <h2 className="h2-title">{t(TEACHER_PLAN.seedsTitleKey)}</h2>
          <ul className="info-list">
            {TEACHER_PLAN.seedKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <h2 className="h2-title">{t('teacher.learningTitle')}</h2>
          <ul className="info-list">
            {[1, 2, 3].map((n) => <li key={n}>{t(`teacher.learning${n}`)}</li>)}
          </ul>
          <h2 className="h2-title">{t('teacher.classChallenge')}</h2>
          <label className="setting-row no-print">
            <input type="checkbox" checked={classroomMode} onChange={onToggleClassroom} />
            {t('classroom.title')}
          </label>
          <p>{t('teacher.predictFirst')} {t('teacher.useCollection')}</p>
          <p><a href={`/?storm=${encodeURIComponent(daily.storm.id)}&site=${daily.site}&difficulty=${daily.difficulty}&seed=${daily.seed}`}>{t('teacher.seedLink', { seed: daily.seed })}</a></p>
          <table className="class-results" aria-label={t('teacher.classResults')}>
            <thead><tr>{[1, 2, 3].map((n) => <th key={n}>{t(`teacher.resultHead${n}`)}</th>)}</tr></thead>
            <tbody>{[1, 2, 3, 4, 5].map((n) => <tr key={n}>
              <td><input aria-label={t('teacher.groupName', { n })} /></td>
              <td><input aria-label={t('teacher.stars', { n })} inputMode="numeric" /></td>
              <td><input aria-label={t('teacher.goals', { n })} /></td>
            </tr>)}</tbody>
          </table>
          <button type="button" className="secondary-btn no-print" onClick={() => window.print()}>{t('teacher.printResults')}</button>
          <button
            type="button"
            className="secondary-btn no-print"
            onClick={() => window.print()}
          >
            {t('info.teacher.print')}
          </button>
        </section>
      )}

      {page === 'about' && (
        <section className="card">
          <InfoTitle>{t('info.about.title')}</InfoTitle>
          <p>{t('info.about.team')}</p>
          <p>{t('info.about.data')}</p>
          <p>{t('info.about.ai')}</p>
          <p>{t('info.about.placeNames')}</p>
          <p>{t('info.about.branding')}</p>
          <label className="setting-row">
            <input type="checkbox" checked={vibration} onChange={onToggleVibration} />
            {t('debrief.vibration')}
          </label>
          <SimpleViewToggle enabled={simpleView} onToggle={onToggleSimpleView} />
          {confirmClear ? (
            <div className="row-between">
              <span>{t('debrief.clearConfirm')}</span>
              <button type="button" onClick={() => { onClearProgress(); setConfirmClear(false) }}>{t('debrief.clearYes')}</button>
              <button type="button" onClick={() => setConfirmClear(false)}>{t('debrief.clearNo')}</button>
            </div>
          ) : (
            <button type="button" className="secondary-btn" onClick={() => setConfirmClear(true)}>{t('debrief.clearProgress')}</button>
          )}
        </section>
      )}

      <div className="nav-strip no-print">
        <button
          type="button"
          data-testid="info-page-sources"
          onClick={() => onSelectPage('sources')}
        >
          {t('info.navShort.sources')}
        </button>
        <button
          type="button"
          data-testid="info-page-simplified"
          onClick={() => onSelectPage('simplified')}
        >
          {t('info.navShort.simplified')}
        </button>
        <button
          type="button"
          data-testid="info-page-glossary"
          onClick={() => onSelectPage('glossary')}
        >
          {t('info.navShort.glossary')}
        </button>
        <button
          type="button"
          data-testid="info-page-teacher"
          onClick={() => onSelectPage('teacher')}
        >
          {t('info.navShort.teacher')}
        </button>
        <button
          type="button"
          data-testid="info-page-about"
          onClick={() => onSelectPage('about')}
        >
          {t('info.navShort.about')}
        </button>
      </div>

      <button
        type="button"
        className="cta-btn no-print"
        data-testid="info-back"
        onClick={onClose}
      >
        {t('info.back')}
      </button>
    </main>
  )
}
