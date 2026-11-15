const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconSprite() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="sprite-sheet">
      <defs>
        <symbol id="icon-bolt" viewBox="0 0 24 24">
          <path d="M13 2 4 14h7l-1 8 10-12h-7z" {...STROKE} />
        </symbol>
        <symbol id="icon-bolt-filled" viewBox="0 0 24 24">
          <path d="M13 2 4 14h7l-1 8 10-12h-7z" fill="currentColor" />
        </symbol>
        <symbol id="icon-air" viewBox="0 0 24 24">
          <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8a2.5 2.5 0 1 1-2.5 2.5" {...STROKE} />
        </symbol>
        <symbol id="icon-heart" viewBox="0 0 24 24">
          <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" {...STROKE} />
        </symbol>
        <symbol id="icon-heart-filled" viewBox="0 0 24 24">
          <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" fill="currentColor" />
        </symbol>
        <symbol id="icon-flask" viewBox="0 0 24 24">
          <path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" {...STROKE} />
        </symbol>
        <symbol id="icon-shield" viewBox="0 0 24 24">
          <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" {...STROKE} />
        </symbol>
        <symbol id="icon-shield-filled" viewBox="0 0 24 24">
          <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" fill="currentColor" />
        </symbol>
        <symbol id="icon-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" {...STROKE} />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" {...STROKE} />
        </symbol>
        <symbol id="icon-signal" viewBox="0 0 24 24">
          <path d="M4 19a11 11 0 0 1 11-11M4 14a6 6 0 0 1 6-6" {...STROKE} />
          <circle cx="5" cy="19" r="1.5" fill="currentColor" />
        </symbol>
        <symbol id="icon-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...STROKE} />
          <path d="M12 7v5l3 2" {...STROKE} />
        </symbol>
        <symbol id="icon-house" viewBox="0 0 24 24">
          <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" {...STROKE} />
        </symbol>
        <symbol id="icon-star" viewBox="0 0 24 24">
          <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z" {...STROKE} />
        </symbol>
        <symbol id="icon-star-filled" viewBox="0 0 24 24">
          <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z" fill="currentColor" />
        </symbol>
        <symbol id="icon-lock" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="9" rx="2" {...STROKE} />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" {...STROKE} />
          <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
        </symbol>
        <symbol id="icon-medal" viewBox="0 0 24 24">
          <circle cx="12" cy="15" r="5" {...STROKE} />
          <path d="M8 3l4 6 4-6M12 12v2" {...STROKE} />
        </symbol>
        <symbol id="icon-calendar" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="2" {...STROKE} />
          <path d="M3 10h18M8 3v4M16 3v4M8 14h1M12 14h1M16 14h1M8 18h1M12 18h1" {...STROKE} />
        </symbol>
        <symbol id="icon-share" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" {...STROKE} />
          <circle cx="6" cy="12" r="3" {...STROKE} />
          <circle cx="18" cy="19" r="3" {...STROKE} />
          <path d="M8.5 10.5l7-4M8.5 13.5l7 4" {...STROKE} />
        </symbol>
        <symbol id="icon-globe" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...STROKE} />
          <path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9z" {...STROKE} />
        </symbol>
        <symbol id="icon-play" viewBox="0 0 24 24">
          <path d="M8 5l11 7-11 7z" {...STROKE} />
        </symbol>
        <symbol id="icon-retry" viewBox="0 0 24 24">
          <path d="M20 12a8 8 0 1 1-2.3-5.7M20 3v5h-5" {...STROKE} />
        </symbol>
        <symbol id="icon-book" viewBox="0 0 24 24">
          <path d="M12 6C9 4 6 4 4 5v14c2-1 5-1 8 1 3-2 6-2 8-1V5c-2-1-5-1-8 1zM12 6v14" {...STROKE} />
        </symbol>
        <symbol id="icon-eye" viewBox="0 0 24 24">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...STROKE} />
          <circle cx="12" cy="12" r="3" {...STROKE} />
        </symbol>
        <symbol id="icon-question" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...STROKE} />
          <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.3-1.5 2.5" {...STROKE} />
          <circle cx="12" cy="17" r="1.2" fill="currentColor" />
        </symbol>
        <symbol id="icon-speaker" viewBox="0 0 24 24">
          <path d="M11 5L6 9H3v6h3l5 4z" {...STROKE} />
          <path d="M15 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" {...STROKE} />
        </symbol>
        <symbol id="icon-speaker-off" viewBox="0 0 24 24">
          <path d="M11 5L6 9H3v6h3l5 4z" {...STROKE} />
          <path d="M16 9l5 6M21 9l-5 6" {...STROKE} />
        </symbol>
      </defs>
    </svg>
  )
}
