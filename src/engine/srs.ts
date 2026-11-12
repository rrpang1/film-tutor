import type { CardRec } from "./types";

export type Grade = "again" | "hard" | "good" | "easy";
const DAY = 86_400_000;
export const MASTERED_DAYS = 21;

export function newCard(now: number): CardRec {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now, updatedAt: now };
}

/** SM-2 with four buttons. Intervals are in days. */
export function review(c: CardRec, g: Grade, now: number): CardRec {
  let { ease, interval, reps, lapses } = c;
  if (g === "again") {
    lapses++; reps = 0; interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ease, interval, reps, lapses, due: now + 10 * 60_000, updatedAt: now };
  }
  const q = g === "hard" ? 3 : g === "good" ? 4 : 5;
  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (reps === 0) interval = g === "easy" ? 3 : 1;
  else if (reps === 1) interval = g === "hard" ? 3 : g === "good" ? 6 : 8;
  else interval = Math.round(interval * (g === "hard" ? 1.2 : g === "good" ? ease : ease * 1.3));
  reps++;
  return { ease, interval, reps, lapses, due: now + interval * DAY, updatedAt: now };
}

export const isDue = (c: CardRec, now: number) => c.due <= now;
export const isMature = (c: CardRec | undefined) => !!c && c.interval >= MASTERED_DAYS;

/** Interleave a queue so neighbours come from different groups where possible. */
export function interleave<T>(items: T[], group: (t: T) => string): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const k = group(it);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(it);
  }
  const out: T[] = [];
  const qs = [...buckets.values()].sort((a, b) => b.length - a.length);
  while (out.length < items.length) {
    for (const q of qs) if (q.length) out.push(q.shift()!);
  }
  return out;
}
