import { useEffect, useMemo, useRef, useState } from 'react'
import { clockStep, previewClock } from '../../engine/clock'
import type { ClockMove, MissionState, SolReport } from '../../engine/types'
import { useI18n } from '../../i18n'
import { Orbi } from '../components/Orbi'
import { SceneView } from '../components/SceneView'
import { TopHud } from '../components/TopHud'
import { playSound } from '../sound'

interface StormClockScreenProps {
  state: MissionState
  shieldLevel: number
  isDustSol: boolean
  outcomeReport: SolReport | null
  onCompleteClock: (moves: ClockMove[]) => void
  onContinue: () => void
  simpleView: boolean
}

function segmentPath(index: number, total: number, r: number): string {
  const cx = 80
  const cy = 80
  const gapDeg = total > 1 ? 8 : 1
  const span = 360 / total
  const startDeg = -90 + index * span + gapDeg / 2
  const endDeg = -90 + (index + 1) * span - gapDeg / 2
  const toRad = (d: number) => (d * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export function StormClockScreen({
  state,
  shieldLevel,
  isDustSol,
  outcomeReport,
  onCompleteClock,
  onContinue,
  simpleView,
}: StormClockScreenProps) {
  const { lang, t } = useI18n()
  const setup = useMemo(() => previewClock(state.cfg), [state.cfg])
  const [moves, setMoves] = useState<ClockMove[]>([])
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const stepInfo = clockStep(setup, moves)
  const hoursText = Number(Math.max(0.1, setup.visibleHours).toFixed(1))

  const handleMove = (choice: ClockMove) => {
    if (animating || outcomeReport) return
    playSound(choice === 'shelter' ? 'door' : 'tick')
    const nextMoves = [...moves, choice]
    const nextStep = clockStep(setup, nextMoves)
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const finalize = () => {
      setMoves(nextMoves)
      setAnimating(false)
      if (nextStep.status !== 'continue') {
        if (nextStep.status === 'caught') {
          playSound('hit')
        } else {
          playSound('success')
        }
        onCompleteClock(nextMoves)
      }
    }

    if (reduceMotion) {
      finalize()
      return
    }

    setAnimating(true)
    timerRef.current = window.setTimeout(finalize, 600)
  }

  let outcomeLine = ''
  let orbiMood: 'calm' | 'worried' = 'calm'
  if (outcomeReport?.clock) {
    const cr = outcomeReport.clock
    outcomeLine = lang === 'en' ? cr.outcomeText : t(cr.outcomeTextKey, cr.outcomeTextParams)
    if (cr.outcome === 'caught') orbiMood = 'worried'
  }

  const caughtWave = outcomeReport?.clock?.outcome === 'caught'

  return (
    <main className={`screen-stack ${outcomeReport ? 'clock-outcome' : ''}`} data-testid="clock">
      <TopHud
        power={outcomeReport ? outcomeReport.power : state.power}
        air={outcomeReport ? outcomeReport.air : state.air}
        health={outcomeReport ? outcomeReport.health : state.health}
        science={outcomeReport ? outcomeReport.science : state.science}
        sol={state.sol}
      />

      <SceneView
        site={state.cfg.site}
        seed={state.cfg.seed}
        shieldLevel={shieldLevel}
        isDustSol={isDustSol}
        showSignal={true}
        sunPulse={animating}
        flareGlow={true}
        waveActive={caughtWave}
        simpleView={simpleView}
        stormActive={!outcomeReport && state.cfg.storm.gapHours !== undefined}
        outcome={state.cfg.storm.gapHours === undefined ? 'false_alarm' : outcomeReport?.clock?.outcome}
      />

      <section className="card clock-panel" aria-label={t('screen.clock')}>
        <div className="ring-wrap">
          <svg
            viewBox="0 0 160 160"
            width="160"
            height="160"
            role="img"
            aria-label={t('clock.ringLabel', { n: setup.K })}
          >
            {Array.from({ length: setup.K }, (_, idx) => {
              const move = moves[idx]
              const isCaughtBlock = caughtWave && idx === moves.length - 1
              let stroke = 'var(--line)'
              if (isCaughtBlock) {
                stroke = 'var(--danger)'
              } else if (move === 'shelter') {
                stroke = 'var(--air)'
              } else if (move === 'work') {
                stroke = 'var(--amber)'
              } else if (!outcomeReport && idx === stepInfo.block - 1) {
                stroke = 'var(--text)'
              }
              return (
                <path
                  key={idx}
                  d={segmentPath(idx, setup.K, 62)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              )
            })}
            <text
              x="80"
              y="76"
              textAnchor="middle"
              fill="var(--text)"
              fontSize="22"
              fontWeight="700"
            >
              {outcomeReport
                ? t('clock.done')
                : `${Math.min(stepInfo.block, setup.K)}/${setup.K}`}
            </text>
            <text
              x="80"
              y="98"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="16"
            >
              {setup.K === 1 ? t('clock.oneBlock') : t('clock.blocks', { n: setup.K })}
            </text>
          </svg>
        </div>

        <div className="clock-copy" aria-live="polite">
          {setup.oldMessage ? (
            <p className="zero-margin">{t('clock.oldMessage')}</p>
          ) : (
            <>
              <p className="zero-margin">
                {t('clock.expected', { hours: hoursText })}
              </p>
              <p className="muted zero-margin">{t('clock.forecastsWrong')}</p>
            </>
          )}
          {state.cfg.site === 'mars' && (
            <p className="muted zero-margin">
              {t('clock.delay', { minutes: setup.delayMinutes })}
            </p>
          )}
        </div>
      </section>

      {outcomeReport ? (
        <>
          <div className="orbi-bubble" aria-live="polite">
            <Orbi mood={orbiMood} />
            <p>{outcomeLine}</p>
          </div>
          <button
            type="button"
            className="cta-btn"
            data-testid="continue"
            onClick={onContinue}
          >
            {t('common.continue')}
          </button>
        </>
      ) : (
        <div className="controls-stack">
          <button
            type="button"
            className="cta-btn"
            data-testid="work-block"
            disabled={animating}
            onClick={() => handleMove('work')}
          >
            {t('clock.work')}
          </button>
          <button
            type="button"
            className="air-btn"
            data-testid="shelter-now"
            disabled={animating}
            onClick={() => handleMove('shelter')}
          >
            {t('clock.shelter')}
          </button>
        </div>
      )}
    </main>
  )
}
