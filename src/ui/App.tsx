import { useEffect, useReducer } from 'react'
import { loadStorms } from '../data/loadStorms'
import type { Plan } from '../engine/types'
import { useI18n } from '../i18n'
import { IconSprite } from './components/IconSprite'
import { TopBar } from './components/TopBar'
import {
  createInitialState,
  DEFAULT_SOL_PLAN,
  missionReducer,
  type BeforeInstallPromptEvent,
  type ScreenName,
} from './missionReducer'
import { BriefingScreen } from './screens/BriefingScreen'
import { DebriefScreen } from './screens/DebriefScreen'
import { InfoScreen } from './screens/InfoScreen'
import { PickerScreen } from './screens/PickerScreen'
import { SolScreen } from './screens/SolScreen'
import { StormClockScreen } from './screens/StormClockScreen'
import { playSound, setMuted } from './sound'

export function App() {
  const { t } = useI18n()
  const [state, dispatch] = useReducer(missionReducer, undefined, createInitialState)

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
    briefing: 'screen.briefing',
    sol: state.site === 'moon' ? 'screen.solMoon' : 'screen.solMars',
    clock: 'screen.clock',
    debrief: 'screen.debrief',
  }

  const runKey = state.mission
    ? `${state.mission.cfg.storm.id}:${state.mission.cfg.seed}`
    : ''
  const pairResults = runKey ? state.worldResults[runKey] : undefined

  const fullPlan: Plan = {
    sols: Array.from({ length: 7 }, (_, idx) => state.solPlans[idx] ?? DEFAULT_SOL_PLAN),
  }

  const handleInstall = async () => {
    if (!state.installPrompt) return
    await state.installPrompt.prompt()
    dispatch({ type: 'SET_INSTALL_PROMPT', event: null })
  }

  const handleMute = () => {
    setMuted(!state.muted)
    dispatch({ type: 'TOGGLE_MUTE' })
  }

  return (
    <div className="app-shell">
      <IconSprite />
      <TopBar
        title={t(state.infoPage ? 'screen.info' : titleMap[state.screen])}
        muted={state.muted}
        isOffline={state.isOffline}
        onToggleMute={handleMute}
        onBack={
          state.infoPage
            ? () => dispatch({ type: 'OPEN_INFO', page: null })
            : state.screen === 'briefing'
              ? () => dispatch({ type: 'BACK_PICKER' })
              : undefined
        }
      />

      {state.infoPage ? (
        <InfoScreen
          page={state.infoPage}
          badge={state.badge}
          onSelectPage={(page) => dispatch({ type: 'OPEN_INFO', page })}
          onClose={() => dispatch({ type: 'OPEN_INFO', page: null })}
        />
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
        />
      ) : state.screen === 'briefing' ? (
        <BriefingScreen
          site={state.site}
          storm={activeStorm}
          difficulty={state.difficulty}
          onBegin={() => {
            playSound('tick')
            dispatch({ type: 'START_MISSION' })
          }}
          onChangePlan={() => dispatch({ type: 'BACK_PICKER' })}
        />
      ) : state.screen === 'sol' && state.mission ? (
        <SolScreen
          state={state.mission}
          solPlan={state.solPlan}
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
        />
      ) : null}
    </div>
  )
}
