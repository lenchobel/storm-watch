export type Rng = () => number

/**
 * Mulberry32 32-bit generator. Deterministic and fast.
 * Same seed returns the exact same sequence.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Returns a random integer in [min, max] inclusive.
 */
export function nextInt(rng: Rng, min: number, max: number): number {
  if (max < min) {
    throw new Error(`nextInt: max ${max} is below min ${min}`)
  }
  return min + Math.floor(rng() * (max - min + 1))
}

