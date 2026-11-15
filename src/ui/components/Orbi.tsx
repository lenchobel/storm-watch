interface OrbiProps {
  mood: 'calm' | 'worried'
}

export function Orbi({ mood }: OrbiProps) {
  const isWorried = mood === 'worried'

  return (
    <svg
      aria-hidden="true"
      width="64"
      height="72"
      viewBox="0 0 64 72"
      className="orbi-svg"
    >
      {/* Antenna stem & amber beacon */}
      <line
        x1="32"
        y1="14"
        x2="32"
        y2="6"
        stroke="var(--muted)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="5"
        r="4"
        fill={isWorried ? 'var(--danger)' : 'var(--amber)'}
      />

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
          <circle cx="24" cy="34" r="3.5" fill="var(--amber)" />
          <circle cx="40" cy="34" r="3.5" fill="var(--amber)" />
          <line
            x1="20"
            y1="28"
            x2="27"
            y2="30"
            stroke="var(--air)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="44"
            y1="28"
            x2="37"
            y2="30"
            stroke="var(--air)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M25 51 Q32 47 39 51"
            fill="none"
            stroke="var(--amber)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="24" cy="33" r="3.5" fill="var(--air)" />
          <circle cx="40" cy="33" r="3.5" fill="var(--air)" />
          <path
            d="M26 50 Q32 54 38 50"
            fill="none"
            stroke="var(--air)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Small base feet */}
      <rect x="18" y="62" width="10" height="6" rx="3" fill="var(--line)" />
      <rect x="36" y="62" width="10" height="6" rx="3" fill="var(--line)" />
    </svg>
  )
}
