export type SoundName = 'tick' | 'warning' | 'hit' | 'door' | 'success' | 'best'

let ctx: AudioContext | null = null
let muted = false

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || muted) return null
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) {
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function playSound(name: SoundName): void {
  const audio = getContext()
  if (!audio) return

  const now = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.connect(gain)
  gain.connect(audio.destination)

  if (name === 'tick') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, now)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.start(now)
    osc.stop(now + 0.08)
  } else if (name === 'warning') {
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(660, now + 0.1)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    osc.start(now)
    osc.stop(now + 0.24)
  } else if (name === 'hit') {
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.28)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.start(now)
    osc.stop(now + 0.28)
  } else if (name === 'door') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
    osc.start(now)
    osc.stop(now + 0.16)
  } else {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, now)
    osc.frequency.setValueAtTime(659, now + 0.09)
    osc.frequency.setValueAtTime(784, now + 0.18)
    if (name === 'best') osc.frequency.setValueAtTime(988, now + 0.27)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (name === 'best' ? 0.44 : 0.34))
    osc.start(now)
    osc.stop(now + (name === 'best' ? 0.44 : 0.34))
  }
}
