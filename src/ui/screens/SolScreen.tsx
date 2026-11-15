import { useMemo } from 'react'
import { previewClock } from '../../engine/clock'
import { affordableBolts } from '../../engine/rules'
import { warningSolFor } from '../../engine/sim'
import type { MissionState, Prediction, SolPlan, TextParams } from '../../engine/types'
import { useI18n } from '../../i18n'
import { Icon } from '../components/Icon'
import { Orbi } from '../components/Orbi'
import { SceneView } from '../components/SceneView'
import { TopHud } from '../components/TopHud'
import { starGoalLine } from '../copy'

interface SolScreenProps {
  state: MissionState
  solPlan: SolPlan
  onChangePlan: (next: SolPlan) => void
  onEndDay: () => void
  prediction: Prediction | null
  onPredict: (prediction: Prediction) => void
  simpleView: boolean
}

const PRESETS: Array<{ id: string; labelKey: string; plan: SolPlan }> = [
  { id: 'safe', labelKey: 'preset.safe', plan: { air: 2, shield: 1, lab: 0 } },
  { id: 'balanced', labelKey: 'preset.balanced', plan: { air: 2, shield: 1, lab: 1 } },
  { id: 'science', labelKey: 'preset.science', plan: { air: 2, shield: 0, lab: 2 } },
]

function samePlan(a: SolPlan, b: SolPlan): boolean {
  return a.air === b.air && a.shield === b.shield && a.lab === b.lab
}

export function SolScreen({
  state,
  solPlan,
  onChangePlan,
  onEndDay,
  prediction,
  onPredict,
  simpleView,
}: SolScreenProps) {
  const { t } = useI18n()
  const maxBolts = affordableBolts(state.power)
  const usedBolts = solPlan.air + solPlan.shield + solPlan.lab
  const remaining = Math.max(0, maxBolts - usedBolts)

  const warnSol = warningSolFor(state.cfg)
  const showWarning = state.sol >= warnSol && state.sol <= state.stormSol
  const isDustSol = state.dustSol === state.sol
  const setup = useMemo(() => previewClock(state.cfg), [state.cfg])

  let orbiLine: { key: string; params?: TextParams } = {
    key: 'sol.orbiSpend',
    params: { sol: state.sol, n: maxBolts },
  }
  let orbiMood: 'calm' | 'worried' = 'calm'

  if (showWarning) {
    orbiMood = 'worried'
    if (setup.oldMessage) {
      orbiLine = { key: 'sol.orbiLate' }
    } else {
      const hoursText = Number(setup.visibleHours.toFixed(1))
      orbiLine = { key: 'sol.orbiWarning', params: { hours: hoursText } }
    }
  } else if (isDustSol) {
    orbiMood = 'worried'
    orbiLine = { key: 'sol.orbiDust' }
  } else if (state.air <= 35 || state.health <= 35) {
    orbiMood = 'worried'
    orbiLine = { key: 'sol.orbiLow' }
  }

  const adjust = (cat: 'air' | 'shield' | 'lab', delta: 1 | -1) => {
    const nextVal = solPlan[cat] + delta
    if (nextVal < 0 || nextVal > 3) return
    if (delta === 1 && usedBolts >= maxBolts) return
    onChangePlan({ ...solPlan, [cat]: nextVal as 0 | 1 | 2 | 3 })
  }

  const activePreset = PRESETS.find((p) => samePlan(p.plan, solPlan))?.id ?? 'custom'
  const goal = starGoalLine(state.cfg.site)

  const rows: Array<{
    cat: 'air' | 'shield' | 'lab'
    nameKey: string
    icon: 'air' | 'shield' | 'flask'
    hintKey: string
  }> = [
    { cat: 'air', nameKey: 'meter.air', icon: 'air', hintKey: 'sol.hintAir' },
    { cat: 'shield', nameKey: 'meter.shield', icon: 'shield', hintKey: 'sol.hintShield' },
    { cat: 'lab', nameKey: 'meter.science', icon: 'flask', hintKey: 'sol.hintLab' },
  ]

  return (
    <main className="screen-stack" data-testid="sol">
      <TopHud
        power={state.power}
        air={state.air}
        health={state.health}
        science={state.science}
        sol={state.sol}
      />

      <SceneView
        site={state.cfg.site}
        seed={state.cfg.seed}
        shieldLevel={solPlan.shield}
        isDustSol={isDustSol}
        showSignal={showWarning}
        flareGlow={showWarning}
        simpleView={simpleView}
      />

      <div className="orbi-bubble" aria-live="polite">
        <Orbi mood={orbiMood} />
        <p>{t(orbiLine.key, orbiLine.params)}</p>
      </div>

      <p className="afford-line zero-margin" aria-live="polite">
        {t('sol.afford', { n: maxBolts, left: remaining })}
      </p>

      <p className="goal-line zero-margin">{t(goal.key, goal.params)}</p>

      {state.cfg.difficulty === 'cadet' && (
        <div className="preset-row" role="group" aria-label={t('sol.presets')}>
          {PRESETS.map((preset) => {
            const cost = preset.plan.air + preset.plan.shield + preset.plan.lab
            const selected = activePreset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-btn ${selected ? 'is-selected' : ''}`}
                disabled={cost > maxBolts}
                aria-pressed={selected}
                onClick={() => onChangePlan(preset.plan)}
              >
                {t(preset.labelKey)}
              </button>
            )
          })}
          <button
            type="button"
            className={`preset-btn ${activePreset === 'custom' ? 'is-selected' : ''}`}
            aria-pressed={activePreset === 'custom'}
            disabled
          >
            {t('preset.custom')}
          </button>
        </div>
      )}

      <div className="controls-stack">
        {rows.map((row) => {
          const val = solPlan[row.cat]
          const name = t(row.nameKey)
          return (
            <div key={row.cat} className="control-card">
              <div className="control-info">
                <Icon name={row.icon} size={22} />
                <div>
                  <div className="control-name">{name}</div>
                  <div className="muted control-hint">{t(row.hintKey)}</div>
                </div>
              </div>
              <div className="control-steppers">
                <button
                  type="button"
                  className="step-btn"
                  aria-label={t('sol.removeBolt', { thing: name })}
                  disabled={val <= 0}
                  onClick={() => adjust(row.cat, -1)}
                >
                  -
                </button>
                <span
                  className="bolt-val"
                  aria-label={t('sol.boltCount', { thing: name })}
                >
                  {val}
                </span>
                <button
                  type="button"
                  className="step-btn"
                  aria-label={t('sol.addBolt', { thing: name })}
                  disabled={val >= 3 || usedBolts >= maxBolts}
                  onClick={() => adjust(row.cat, 1)}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {state.sol === state.stormSol && (
        <section className="card" aria-label={t('predict.title')}>
          <h2 className="h2-title">{t('predict.title')}</h2>
          <div className="toggle-row">
            {(['yes', 'no', 'unsure'] as Prediction[]).map((choice) => (
              <button key={choice} type="button" aria-pressed={prediction === choice}
                data-testid={`predict-${choice}`}
                className={prediction === choice ? 'is-selected' : ''}
                onClick={() => onPredict(choice)}>
                {t(`predict.${choice}`)}
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className="cta-btn"
        data-testid="end-day"
        disabled={state.sol === state.stormSol && prediction === null}
        onClick={onEndDay}
      >
        {t('sol.endDay')}
      </button>
    </main>
  )
}
