import { compareWorlds } from '../../engine/compare'
import type { Result, Site } from '../../engine/types'
import { useI18n } from '../../i18n'

interface CompareCardProps {
  moon: Result
  mars: Result
}

export function CompareCard({ moon, mars }: CompareCardProps) {
  const { lang, t } = useI18n()
  const { rows, sentence, textKey, textParams } = compareWorlds(
    { site: 'moon' as Site, result: moon },
    { site: 'mars' as Site, result: mars }
  )

  return (
    <section className="card" aria-label={t('compare.title')}>
      <h2 className="h2-title">{t('compare.title')}</h2>
      <p>{lang === 'en' ? sentence : t(textKey, textParams)}</p>
      <div className="compare-table" role="table" aria-label={t('compare.tableLabel')}>
        <div className="compare-row compare-head" role="row">
          <span role="columnheader">{t('compare.measure')}</span>
          <span role="columnheader">{t('site.moon')}</span>
          <span role="columnheader">{t('site.mars')}</span>
        </div>
        {rows.map((row) => (
          <div key={row.labelKey} className="compare-row" role="row">
            <span role="rowheader" className="muted">
              {lang === 'en' ? row.label : t(row.labelKey)}
            </span>
            <span role="cell">
              {lang === 'en' || !row.aKey ? row.a : t(row.aKey, row.aParams)}
            </span>
            <span role="cell">
              {lang === 'en' || !row.bKey ? row.b : t(row.bKey, row.bParams)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
