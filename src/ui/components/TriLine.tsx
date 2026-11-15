interface TriLineProps {
  title?: boolean
}

/** Three equal bars: green, gold, red. Decorative, so hidden from readers. */
export function TriLine({ title = false }: TriLineProps) {
  return (
    <div
      className={`tri-line${title ? ' tri-line-title' : ''}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  )
}
