/**
 * Deterministic PRNG interface so rules, shuffling, and AI tie-breaking
 * can run reproducibly in unit tests as well as randomly in live play.
 */
export interface Rng {
  /** Returns an integer in [0, maxExclusive - 1] */
  nextInt(maxExclusive: number): number;
}

export function createDefaultRng(): Rng {
  return {
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 1) return 0;
      return Math.floor(Math.random() * maxExclusive);
    },
  };
}

/** Mulberry32 deterministic PRNG for reproducible tests */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 1) return 0;
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const val = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(val * maxExclusive);
    },
  };
}
