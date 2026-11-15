import { useEffect, useRef, useState } from 'react'
import { evaluateGoals } from '../engine/goals'
import type { AppState } from './missionReducer'
import { bestStarsKey, loadProgress, localDayKey, recordForecast, recordRun, type Progress } from './progress'
import { rankFor, totalStars } from './ranks'
import { playSound } from './sound'

export function useRunProgress(state: AppState) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [rankUp, setRankUp] = useState<string | null>(null)
  const [newBest, setNewBest] = useState(false)
  const recordedRun = useRef('')
  const vibratedFor = useRef('')

  useEffect(() => {
    if (state.screen !== 'debrief' || !state.mission || !state.finalResult) return
    const cfg = state.mission.cfg
    const runId = `${cfg.storm.id}:${cfg.site}:${cfg.difficulty}:${cfg.seed}`
    if (recordedRun.current === runId) return
    recordedRun.current = runId
    const oldStars = totalStars(progress, state.storms)
    const bestKey = bestStarsKey(cfg.storm.id, cfg.site, cfg.difficulty)
    const oldBest = progress.bestStars[bestKey] ?? 0
    const goalsDone = evaluateGoals(cfg, state.finalResult).filter((goal) => goal.done).map((goal) => goal.id)
    let next = recordRun(progress, {
      date: localDayKey(), stormId: cfg.storm.id, site: cfg.site,
      difficulty: cfg.difficulty, stars: state.finalResult.stars, goalsDone,
    })
    const particlesCame = cfg.storm.gapHours !== undefined
    if (state.prediction) next = recordForecast(next, state.prediction, particlesCame)
    setProgress(next)
    const newRank = rankFor(totalStars(next, state.storms)).current
    if (rankFor(oldStars).current.name !== newRank.name) setRankUp(newRank.name)
    const improved = state.finalResult.stars > oldBest
    setNewBest(improved)
    if (improved) playSound('best')
  }, [state.screen, state.mission, state.finalResult, state.storms, state.prediction, progress])

  useEffect(() => {
    const report = state.pendingClockOutcome?.report
    const runId = state.mission ? `${state.mission.cfg.storm.id}:${state.mission.cfg.seed}:${state.mission.sol}` : ''
    if (!report || report.clock?.outcome !== 'caught' || !runId || vibratedFor.current === runId) return
    vibratedFor.current = runId
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (progress.settings.vibration && !state.muted && !reduced && typeof navigator.vibrate === 'function') navigator.vibrate(20)
  }, [state.pendingClockOutcome, state.mission, state.muted, progress.settings.vibration])

  useEffect(() => {
    if (state.screen !== 'debrief') { setRankUp(null); setNewBest(false) }
  }, [state.screen])

  return { progress, setProgress, rankUp, newBest }
}
