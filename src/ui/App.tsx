import { useEffect, useReducer } from 'react'
import { loadStorms } from '../data/loadStorms'
import type { Plan } from '../engine/types'
import { dailyMission } from '../engine/daily'
import { goalsFor } from '../engine/goals'
import { useI18n } from '../i18n'
import { IconSprite } from './components/IconSprite'
import { TopBar } from './components/TopBar'
import { TriLine } from './components/TriLine'
import {
  DEFAULT_SOL_PLAN,
  missionReducer,
  type BeforeInstallPromptEvent,
  type ScreenName,
} from './missionReducer'
import { createInitialState } from './initialState'
import { BriefingScreen } from './screens/BriefingScreen'
import { CollectionScreen } from './screens/CollectionScreen'
import { DebriefScreen } from './screens/DebriefScreen'
import { InfoScreen } from './screens/InfoScreen'
import { PickerScreen } from './screens/PickerScreen'
import { SolScreen } from './screens/SolScreen'
import { StormClockScreen } from './screens/StormClockScreen'
import { playSound, setMuted } from './sound'
import { bestStarsKey, updateSettings, clearProgress } from './progress'
import { useRunProgress } from './useRunProgress'
import './progress.css'
export function App() {
  const { t } = useI18n()
  const [state, dispatch] = useReducer(missionReducer, undefined, createInitialState)
  const { progress, setProgress, rankUp, newBest } = useRunProgress(state)

  useEffect(() => {
    let active = true
    void loadStorms().then((res) => {
      if (active) {
        dispatch({ type: 'LOADED_STORMS', storms: res.storms, badge: res.badge })
      }
    })
    const onOffline = () => dispatch({ type: 'SET_OFFLINE', offline: true })
    const onOnline = () => dispatch({ type: 'SET_OFFLINE', offline: false })
    const onPrompt = (e: Event) => {
      e.preventDefault()
      dispatch({ type: 'SET_INSTALL_PROMPT', event: e as BeforeInstallPromptEvent })
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    window.addEventListener('beforeinstallprompt', onPrompt)
    setMuted(state.muted)
    return () => {
      active = false
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])
  const activeStorm =
    state.storms.find((s) => s.id === state.stormId) ?? state.storms[0]
  const titleMap: Record<ScreenName, string> = {
    picker: 'screen.picker',
    collection: 'collection.title',
    briefing: 'screen.briefing',
    sol: state.site === 'moon' ? 'screen.solMoon' : 'screen.solMars',
    clock: 'screen.clock',
    debrief: 'screen.debrief',
  }
  const runKey = state.mission
    ? `${state.mission.cfg.storm.id}:${state.mission.cfg.seed}`
    : ''
  const pairResults = runKey ? state.worldResults[runKey] : undefined
  const daily = dailyMission(state.storms, new Date())
  const fullPlan: Plan = {
    sols: Array.from({ length: 7 }, (_, idx) => state.solPlans[idx] ?? DEFAULT_SOL_PLAN),
  }

  const handleInstall = async () => {
    if (!state.installPrompt) return
    await state.installPrompt.prompt()
    dispatch({ type: 'SET_INSTALL_PROMPT', event: null })
  }
  const handleMute = () => {
    const muted = !state.muted
    setMuted(muted)
    setProgress(updateSettings({ muted }))
    dispatch({ type: 'TOGGLE_MUTE' })
  }
  const handleClassroom = () => {
    const classroom = !progress.settings.classroom
    const settings = classroom ? { classroom, muted: true, vibration: false } : { classroom }
    setProgress(updateSettings(settings))
    if (classroom && !state.muted) {
      setMuted(true)
      dispatch({ type: 'TOGGLE_MUTE' })
    }
  }
  const handleSimpleView = () => {
    setProgress((current) => updateSettings({ simpleView: !current.settings.simpleView }))
  }

  return (
    <>
      <TriLine />
      <div className={`app-shell ${progress.settings.classroom ? 'classroom-mode' : ''}`}>
        <IconSprite />
        <TopBar
        title={t(state.infoPage ? 'screen.info' : titleMap[state.screen])}
        muted={state.muted}
        isOffline={state.isOffline}
        onToggleMute={handleMute}
        vibration={progress.settings.vibration}
        onToggleVibration={() => setProgress((current) => updateSettings({ vibration: !current.settings.vibration }))}
        simpleView={progress.settings.simpleView}
        onToggleSimpleView={handleSimpleView}
        onClearProgress={() => setProgress(clearProgress())}
        onBack={
          state.infoPage
            ? () => dispatch({ type: 'OPEN_INFO', page: null })
            : state.screen === 'briefing'
              ? () => dispatch({ type: 'BACK_PICKER' })
              : undefined
        }
      />

      {state.challengeStars !== null && state.screen !== 'picker' && (
        <p className="challenge-banner">{t('debrief.challengeBanner', { n: state.challengeStars })}</p>
      )}

      {state.infoPage ? (
        <InfoScreen
          page={state.infoPage}
          badge={state.badge}
          onSelectPage={(page) => dispatch({ type: 'OPEN_INFO', page })}
          onClose={() => dispatch({ type: 'OPEN_INFO', page: null })}
          vibration={progress.settings.vibration}
          onToggleVibration={() => setProgress((current) => updateSettings({ vibration: !current.settings.vibration }))}
          onClearProgress={() => setProgress(clearProgress())}
          classroomMode={progress.settings.classroom}
          onToggleClassroom={handleClassroom}
          daily={daily}
          simpleView={progress.settings.simpleView}
          onToggleSimpleView={handleSimpleView}
        />
      ) : state.screen === 'collection' ? (
        <CollectionScreen storms={state.storms} progress={progress} onBack={() => dispatch({ type: 'BACK_PICKER' })} />
      ) : state.screen === 'picker' ? (
        <PickerScreen
          storms={state.storms}
          badge={state.badge}
          site={state.site}
          stormId={state.stormId}
          difficulty={state.difficulty}
          canInstall={state.installPrompt !== null}
          onInstallApp={() => void handleInstall()}
          onSelectSite={(site) => {
            playSound('tick')
            dispatch({ type: 'SET_SITE', site })
          }}
          onSelectStorm={(id) => {
            playSound('tick')
            dispatch({ type: 'SET_STORM', id })
          }}
          onSelectDifficulty={(difficulty) => {
            playSound('tick')
            dispatch({ type: 'SET_DIFFICULTY', difficulty })
          }}
          onStart={() => {
            playSound('warning')
            dispatch({ type: 'GO_BRIEFING' })
          }}
          onOpenInfo={(page) => dispatch({ type: 'OPEN_INFO', page })}
          progress={progress}
          daily={daily}
          onPlayDaily={() => dispatch({ type: 'DAILY_MISSION', config: daily })}
          onOpenCollection={() => dispatch({ type: 'OPEN_COLLECTION' })}
          classroomMode={progress.settings.classroom}
          onToggleClassroom={handleClassroom}
          simpleView={progress.settings.simpleView}
        />
      ) : state.screen === 'briefing' ? (
        <BriefingScreen
          site={state.site}
          storm={activeStorm}
          difficulty={state.difficulty}
          bestStars={progress.bestStars[bestStarsKey(state.stormId, state.site, state.difficulty)] ?? 0}
          goals={goalsFor({ site: state.site, storm: activeStorm, seed: state.seed, difficulty: state.difficulty })}
          onBegin={() => {
            playSound('tick')
            dispatch({ type: 'START_MISSION' })
          }}
          onChangePlan={() => dispatch({ type: 'BACK_PICKER' })}
        />
      ) : state.screen === 'sol' && state.mission ? (
        <SolScreen
          state={state.mission}
          simpleView={progress.settings.simpleView}
          solPlan={state.solPlan}
          prediction={state.prediction}
          onPredict={(prediction) => dispatch({ type: 'SET_PREDICTION', prediction })}
          onChangePlan={(plan) => {
            playSound('tick')
            dispatch({ type: 'SET_SOL_PLAN', plan })
          }}
          onEndDay={() => {
            playSound(
              state.mission?.sol === state.mission?.stormSol ? 'warning' : 'tick'
            )
            dispatch({ type: 'SUBMIT_SOL' })
          }}
        />
      ) : state.screen === 'clock' && state.mission ? (
        <StormClockScreen
          state={state.mission}
          simpleView={progress.settings.simpleView}
          shieldLevel={state.solPlan.shield}
          isDustSol={state.mission.dustSol === state.mission.sol}
          outcomeReport={state.pendingClockOutcome?.report ?? null}
          onCompleteClock={(moves) => dispatch({ type: 'FINISH_CLOCK', moves })}
          onContinue={() => {
            playSound('tick')
            dispatch({ type: 'CONTINUE_AFTER_CLOCK' })
          }}
        />
      ) : state.screen === 'debrief' && state.mission && state.finalResult ? (
        <DebriefScreen
          cfg={state.mission.cfg}
          plan={fullPlan}
          result={state.finalResult}
          moonResult={pairResults?.moon}
          marsResult={pairResults?.mars}
          onTryAgain={() => {
            playSound('tick')
            dispatch({ type: 'START_MISSION', seed: state.seed + 1 })
          }}
          onFlyOtherWorld={() => {
            playSound('warning')
            dispatch({
              type: 'START_MISSION',
              site: state.mission?.cfg.site === 'moon' ? 'mars' : 'moon',
              seed: state.seed,
            })
          }}
          onPickAnother={() => dispatch({ type: 'BACK_PICKER' })}
          onOpenInfo={(page) => dispatch({ type: 'OPEN_INFO', page })}
          bestStars={progress.bestStars[bestStarsKey(state.mission.cfg.storm.id, state.mission.cfg.site, state.mission.cfg.difficulty)] ?? 0}
          rankUp={rankUp}
          newBest={newBest}
          prediction={state.prediction}
        />
      ) : null}
      </div>
    </>
  )
}
