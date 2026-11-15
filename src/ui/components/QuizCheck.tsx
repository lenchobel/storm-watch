import { useState } from 'react'
import { useI18n } from '../../i18n'
import { QUIZ_ITEMS } from '../copy'

export function QuizCheck() {
  const { t } = useI18n()
  const [answers, setAnswers] = useState<Record<string, number>>({})

  return (
    <section className="card" aria-label={t('quiz.sectionLabel')}>
      <h2 className="h2-title">{t('quiz.title')}</h2>
      <div className="quiz-list">
        {QUIZ_ITEMS.map((item) => {
          const picked = answers[item.id]
          return (
            <div key={item.id} className="quiz-item">
              <p className="quiz-q">{t(item.questionKey)}</p>
              <div className="quiz-options">
                {item.optionKeys.map((optionKey, idx) => {
                  const selected = picked === idx
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      className={`quiz-btn ${selected ? 'is-selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [item.id]: idx }))
                      }
                    >
                      {t(optionKey)}
                    </button>
                  )
                })}
              </div>
              {picked !== undefined && (
                <p className="quiz-explain" role="status">
                  {picked === item.correctIndex ? t('quiz.right') : t('quiz.notQuite')}{' '}
                  {t(item.explanationKey)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
