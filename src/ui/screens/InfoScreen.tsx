import type { StormBadge } from '../../data/loadStorms'
import factsData from '../../data/facts.json'
import { useI18n } from '../../i18n'
import { GLOSSARY, SIMPLIFIED_POINTS, TEACHER_PLAN } from '../copy'
import type { InfoPageId } from '../components/InfoNav'

interface InfoScreenProps {
  page: InfoPageId
  badge: StormBadge
  onSelectPage: (page: InfoPageId) => void
  onClose: () => void
}

export function InfoScreen({
  page,
  badge,
  onSelectPage,
  onClose,
}: InfoScreenProps) {
  const { t } = useI18n()

  return (
    <main className="screen-stack" data-testid="info">
      {page === 'sources' && (
        <section className="card">
          <h1 className="brand-title">{t('info.sources.title')}</h1>
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
          <h1 className="brand-title">{t('info.simplified.title')}</h1>
          <ul className="info-list">
            {SIMPLIFIED_POINTS.map((pointKey) => (
              <li key={pointKey}>{t(pointKey)}</li>
            ))}
          </ul>
        </section>
      )}

      {page === 'glossary' && (
        <section className="card">
          <h1 className="brand-title">{t('info.glossary.title')}</h1>
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
        <section className="card">
          <h1 className="brand-title">{t(TEACHER_PLAN.titleKey)}</h1>
          <p>{t(TEACHER_PLAN.goalKey)}</p>
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
          <h1 className="brand-title">{t('info.about.title')}</h1>
          <p>{t('info.about.team')}</p>
          <p>{t('info.about.data')}</p>
          <p>{t('info.about.ai')}</p>
          <p>{t('info.about.branding')}</p>
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
