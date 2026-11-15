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
  | 'speaker'
  | 'speaker-off'

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <use href={`#icon-${name}`} />
    </svg>
  )
}
