import type { Progress, Rank } from "./types";

/** Length of roll `level` in units. 24, 30, 36 … capped at 72 (a bulk-loaded roll). */
export function rollLength(level: number): number {
  return Math.min(72, 24 + (level - 1) * 6);
}

export function totalXp(p: Progress): number {
  return p.xp.reduce((s, e) => s + e.amount, 0);
}

export type LevelInfo = { level: number; into: number; length: number; total: number };

export function levelFromXp(xp: number): LevelInfo {
  let level = 1, rest = xp;
  while (rest >= rollLength(level)) { rest -= rollLength(level); level++; }
  return { level, into: rest, length: rollLength(level), total: xp };
}

export function rankFor(level: number, ranks: Rank[]): Rank {
  let r = ranks[0];
  for (const k of ranks) if (level >= k.level) r = k;
  return r;
}
