import { useI18n } from '../../i18n'
import { TOTAL_SOLS } from '../../engine/rules'
import { Icon } from './Icon'

interface TopHudProps {
  power: number
  air: number
  health: number
  science: number
  sol: number
}

function MeterBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="meter-track"
    >
      <rect x="0" y="0" width={clamped} height="10" rx="5" fill={color} />
    </svg>
  )
}

export function TopHud({ power, air, health, science, sol }: TopHudProps) {
  const { t } = useI18n()

  return (
    <header className="hud-bar" aria-label={t('hud.status')}>
      <div
        className="meter"
        aria-live="polite"
        aria-label={t('meter.powerValue', { n: power })}
      >
        <div className="meter-head">
          <Icon name="bolt" size={16} />
          <span>{t('meter.power')}</span>
        </div>
        <MeterBar value={power} color="var(--power)" />
        <div className="meter-val">{power}</div>
      </div>

      <div
        className="meter"
        aria-live="polite"
        aria-label={t('meter.airValue', { n: air })}
      >
        <div className="meter-head">
          <Icon name="air" size={16} />
          <span>{t('meter.air')}</span>
        </div>
        <MeterBar value={air} color="var(--air)" />
        <div className="meter-val">{air}</div>
      </div>

      <div
        className="meter"
        aria-live="polite"
        aria-label={t('meter.healthValue', { n: health })}
      >
        <div className="meter-head">
          <Icon name="heart" size={16} />
          <span>{t('meter.health')}</span>
        </div>
        <MeterBar value={health} color="var(--health)" />
        <div className="meter-val">{health}</div>
      </div>

      <div className="sol-counter" aria-live="polite">
        <div>{t('hud.sol', { sol, total: TOTAL_SOLS })}</div>
        <div
          className="hud-science"
          aria-label={t('meter.scienceValue', { n: science })}
        >
          <Icon name="flask" size={16} />
          <span>{science}</span>
        </div>
      </div>
    </header>
  )
}
