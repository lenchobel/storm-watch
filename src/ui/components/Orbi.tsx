import { useI18n } from '../../i18n'

export type OrbiStatus = 'calm' | 'warning' | 'storm'

interface OrbiProps {
  mood: 'calm' | 'worried'
  status?: OrbiStatus
}

export function Orbi({ mood, status }: OrbiProps) {
  const { t } = useI18n()
  const isWorried = mood === 'worried'
  const light = status ?? (isWorried ? 'warning' : 'calm')

  return (
    <div className="orbi-figure">
      <svg
        aria-hidden="true"
        width="64"
        height="72"
        viewBox="0 0 64 72"
        className="orbi-svg"
      >
        {/* Antenna stem and status light: shape carries meaning too. */}
        <line
          x1="32"
          y1="14"
          x2="32"
          y2="6"
          stroke="var(--muted)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {light === 'calm' && <circle cx="32" cy="5" r="4" fill="var(--green)" />}
        {light === 'warning' && (
          <circle
            cx="32"
            cy="5"
            r="4"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2.5"
          />
        )}
        {light === 'storm' && (
          <path d="M32 1l6 9H26z" fill="var(--red)" stroke="var(--red)" strokeWidth="1" />
        )}

        {/* Rounded box body */}
        <rect
          x="8"
          y="14"
          width="48"
          height="48"
          rx="12"
          fill="var(--panel)"
          stroke="var(--line)"
          strokeWidth="2"
        />

        {/* Wide visor */}
        <rect
          x="14"
          y="24"
          width="36"
          height="18"
          rx="6"
          fill="var(--navy)"
          stroke="var(--air)"
          strokeWidth="1.5"
        />

        {/* Two round eyes */}
        {isWorried ? (
          <>
            <circle cx="24" cy="34" r="3.5" fill="var(--gold)" />
            <circle cx="40" cy="34" r="3.5" fill="var(--gold)" />
            <line x1="20" y1="28" x2="27" y2="30" stroke="var(--air)" strokeWidth="2" strokeLinecap="round" />
            <line x1="44" y1="28" x2="37" y2="30" stroke="var(--air)" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 51Q32 47 39 51" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="24" cy="33" r="3.5" fill="var(--air)" />
            <circle cx="40" cy="33" r="3.5" fill="var(--air)" />
            <path d="M26 50Q32 54 38 50" fill="none" stroke="var(--air)" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Small base feet */}
        <rect x="18" y="62" width="10" height="6" rx="3" fill="var(--line)" />
        <rect x="36" y="62" width="10" height="6" rx="3" fill="var(--line)" />
      </svg>
      <span className={`orbi-state orbi-state-${light}`}>{t(`orbi.${light}`)}</span>
    </div>
  )
}
