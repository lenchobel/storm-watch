export type IconName =
  | 'bolt'
  | 'air'
  | 'heart'
  | 'flask'
  | 'shield'
  | 'sun'
  | 'signal'
  | 'clock'
  | 'house'
  | 'star'
  | 'lock'
  | 'medal'
  | 'calendar'
  | 'share'
  | 'globe'
  | 'play'
  | 'retry'
  | 'book'
  | 'eye'
  | 'question'
  | 'speaker'
  | 'speaker-off'

const FILLABLE = new Set<IconName>(['bolt', 'heart', 'shield', 'star'])

interface IconProps {
  name: IconName
  size?: number
  className?: string
  filled?: boolean
}

export function Icon({ name, size = 20, className, filled = false }: IconProps) {
  const id = filled && FILLABLE.has(name) ? `${name}-filled` : name
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      focusable="false"
    >
      <use href={`#icon-${id}`} />
    </svg>
  )
}
