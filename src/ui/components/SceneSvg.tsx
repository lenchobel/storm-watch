import { useMemo } from 'react'
import { mulberry32 } from '../../engine/rng'
import type { Site } from '../../engine/types'
import { useI18n } from '../../i18n'

export interface SceneSvgProps {
  site: Site
  seed: number
  shieldLevel: number
  isDustSol?: boolean
  showSignal?: boolean
  sunPulse?: boolean
  flareGlow?: boolean
  waveActive?: boolean
}

const CRATERS = [
  { cx: 48, cy: 204, rx: 22, ry: 7 },
  { cx: 122, cy: 218, rx: 16, ry: 5 },
  { cx: 215, cy: 200, rx: 26, ry: 8 },
  { cx: 288, cy: 222, rx: 18, ry: 6 },
  { cx: 336, cy: 196, rx: 14, ry: 4 },
]

const PANEL_XS = [60, 100, 260]
const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]

export function SceneSvg({
  site,
  seed,
  shieldLevel,
  isDustSol = false,
  showSignal = false,
  sunPulse = false,
  flareGlow = false,
  waveActive = false,
}: SceneSvgProps) {
  const { t } = useI18n()
  const stars = useMemo(() => {
    const rng = mulberry32((seed ^ 0x517cc1b7) >>> 0)
    return Array.from({ length: 40 }, () => ({
      cx: Math.round(rng() * 356 * 10) / 10 + 2,
      cy: Math.round(rng() * 158 * 10) / 10 + 4,
      r: Math.round((0.6 + rng() * 0.8) * 100) / 100,
      opacity: Math.round((0.4 + rng() * 0.5) * 100) / 100,
    }))
  }, [seed])

  const isMars = site === 'mars'
  const panelOpacity = isDustSol ? 0.35 : isMars ? 0.6 : 1
  const shieldOpacity = Math.round((0.15 + 0.28 * shieldLevel) * 100) / 100

  return (
    <div
      className="scene-frame"
      role="img"
      aria-label={t(site === 'moon' ? 'scene.moonAlt' : 'scene.marsAlt')}
    >
      <svg viewBox="0 0 360 240" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="flareGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Flat sky */}
        <rect
          x="0"
          y="0"
          width="360"
          height="240"
          fill={isMars ? 'var(--mars-sky)' : 'var(--navy)'}
        />

        {/* 40 seeded stars */}
        {stars.map((s, idx) => (
          <circle
            key={idx}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="var(--text)"
            opacity={s.opacity}
          />
        ))}

        {/* Earth at (44, 40) */}
        <g>
          <circle cx="44" cy="40" r="12" fill="var(--air)" />
          <path
            d="M37 35 Q43 32 45 38 T40 46 Z"
            fill="var(--green)"
          />
          <path
            d="M47 33 Q52 36 51 43 L46 41 Z"
            fill="var(--green)"
          />
        </g>

        {/* Sun at (312, 36) with a soft gold glow */}
        <g className={sunPulse ? 'sun-pulsing' : undefined}>
          <circle cx="312" cy="36" r="42" fill="url(#sunGlowGrad)" />
          {flareGlow && (
            <circle cx="312" cy="36" r="34" fill="url(#flareGlowGrad)" />
          )}
          <circle cx="312" cy="36" r="16" fill="var(--gold)" />
          {SUN_RAYS.map((deg) => {
            const rad = (deg * Math.PI) / 180
            const x1 = 312 + Math.cos(rad) * 20
            const y1 = 36 + Math.sin(rad) * 20
            const x2 = 312 + Math.cos(rad) * 26
            const y2 = 36 + Math.sin(rad) * 26
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--gold)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
        </g>

        {/* Signal path and traveling dot */}
        {showSignal && (
          <g>
            <path
              d="M 56 44 Q 118 68 180 120"
              fill="none"
              stroke="var(--air)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.55"
            />
            <circle r="3.5" fill="var(--gold)" className="signal-dot" />
          </g>
        )}

        {/* Ground across bottom 70px */}
        <path
          d="M0 170 L360 170 L360 240 L0 240 Z"
          fill={isMars ? 'var(--earth)' : 'var(--moon)'}
        />
        {isMars ? (
          <rect
            x="0"
            y="188"
            width="360"
            height="18"
            fill="var(--dust)"
            opacity="0.7"
          />
        ) : (
          CRATERS.map((c, i) => (
            <ellipse
              key={i}
              cx={c.cx}
              cy={c.cy}
              rx={c.rx}
              ry={c.ry}
              fill="var(--navy)"
              opacity="0.25"
            />
          ))
        )}

        <path d="M0 178 Q54 145 112 178 Q164 142 218 178 Q282 145 360 176 L360 240 L0 240Z" fill={isMars ? 'var(--dust)' : 'var(--line)'} opacity="0.55" />
        <path d="M0 188 Q62 160 126 188 Q202 151 274 188 Q320 166 360 184 L360 240 L0 240Z" fill={isMars ? 'var(--earth)' : 'var(--moon)'} opacity="0.82" />

        {/* Three solar panels 28x6 at x=60, 100, 260 */}
        <g opacity={panelOpacity}>
          {PANEL_XS.map((px) => (
            <g key={px}>
              <line
                x1={px + 14}
                y1="164"
                x2={px + 14}
                y2="172"
                stroke="var(--muted)"
                strokeWidth="2"
              />
              <rect
                x={px}
                y="158"
                width="28"
                height="6"
                rx="1.5"
                fill="var(--panel)"
                stroke="var(--air)"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </g>

        {/* Habitat dome radius 46 centered at x=180 on ground line y=170 */}
        <path
          d="M134 170 A46 46 0 0 1 226 170 Z"
          fill="var(--panel)"
          stroke="var(--text)"
          strokeWidth="2"
        />
        <rect
          x="171"
          y="148"
          width="18"
          height="22"
          rx="3"
          fill="var(--navy)"
          stroke="var(--air)"
          strokeWidth="1.5"
        />
        <line x1="180" y1="124" x2="180" y2="117" stroke="var(--text)" strokeWidth="2" />
        <path d="M173 116 Q180 122 187 116" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
        <path d="M122 170 A58 58 0 0 1 238 170" fill="none" stroke="var(--gold)" strokeWidth="3" strokeDasharray="7 5" opacity={shieldOpacity} />
        {isDustSol && <rect x="0" y="0" width="360" height="240" fill="var(--dust)" opacity="0.34" />}
        {waveActive && <rect x="0" y="0" width="120" height="240" fill="var(--red)" opacity="0.32" className="wave-sweep" />}
      </svg>
    </div>
  )
}
