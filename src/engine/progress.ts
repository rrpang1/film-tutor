import type { Card, Progress, SubjectPack, XpEvent } from "./types";
import { isDue, newCard, review, type Grade, interleave } from "./srs";

export const SCHEMA = 1;

export function emptyProgress(now = Date.now()): Progress {
  return { schemaVersion: SCHEMA, nodes: {}, cards: {}, xp: [], logs: {}, library: {}, critiques: {}, days: [], updatedAt: now };
}

/** Bring any older saved shape up to the current schema. */
export function migrate(raw: unknown): Progress {
  const base = emptyProgress(0);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Progress>;
  // v0 → v1 would go here; v1 is the first schema.
  return {
    ...base,
    ...r,
    nodes: r.nodes ?? {}, cards: r.cards ?? {}, xp: r.xp ?? [], logs: r.logs ?? {},
    library: r.library ?? {}, critiques: r.critiques ?? {}, days: r.days ?? [],
    schemaVersion: SCHEMA,
  };
}

const today = (now: number) => new Date(now).toLocaleDateString("en-CA");

export function award(p: Progress, id: string, amount: number, reason: string, now: number): Progress {
  if (amount <= 0 || p.xp.some((e) => e.id === id)) return p;
  const ev: XpEvent = { id, at: now, amount, reason };
  return touchDay({ ...p, xp: [...p.xp, ev], updatedAt: now }, now);
}

export function touchDay(p: Progress, now: number): Progress {
  const d = today(now);
  return p.days.includes(d) ? p : { ...p, days: [...p.days, d].sort() };
}

/** Record a proof (quiz) attempt. Passing for the first time learns the node and enrolls its cards. */
export function recordProof(pack: SubjectPack, p: Progress, nodeId: string, score: number, pass: boolean, now: number): Progress {
  const node = pack.nodes.find((n) => n.id === nodeId)!;
  const prev = p.nodes[nodeId] ?? { attempts: 0, updatedAt: now };
  const firstPass = pass && !prev.learnedAt;
  let next: Progress = {
    ...p,
    nodes: {
      ...p.nodes,
      [nodeId]: { ...prev, attempts: prev.attempts + 1, best: Math.max(prev.best ?? 0, score), learnedAt: prev.learnedAt ?? (pass ? now : undefined), updatedAt: now },
    },
    updatedAt: now,
  };
  if (firstPass) {
    const cards = { ...next.cards };
    for (const c of node.cards) if (!cards[c.id]) cards[c.id] = newCard(now);
    next = award({ ...next, cards }, `learn:${nodeId}`, node.xp, `developed “${node.title}”`, now);
  }
  return touchDay(next, now);
}

export type QueueCard = Card & { group: string; source: string };

/** All cards the pack knows about, tagged by where they came from. */
export function allCards(pack: SubjectPack): QueueCard[] {
  return [
    ...pack.nodes.flatMap((n) => n.cards.map((c) => ({ ...c, group: n.branch, source: n.title }))),
    ...pack.glossary.map((c) => ({ ...c, group: "glossary", source: "speaking photography" })),
  ];
}

export function dueQueue(pack: SubjectPack, p: Progress, now: number): QueueCard[] {
  const due = allCards(pack).filter((c) => p.cards[c.id] && isDue(p.cards[c.id], now));
  return interleave(due, (c) => c.group);
}

export function gradeCard(p: Progress, cardId: string, g: Grade, now: number): Progress {
  const cur = p.cards[cardId] ?? newCard(now);
  const next = { ...p, cards: { ...p.cards, [cardId]: review(cur, g, now) }, updatedAt: now };
  // a successful recall is evidence; one frame per card per day
  return g === "again" ? touchDay(next, now) : award(next, `rev:${cardId}:${today(now)}`, 1, "recalled a card", now);
}

/** Enroll glossary cards in the queue (a pack-level deck, unlocked by the critique branch). */
export function enroll(p: Progress, ids: string[], now: number): Progress {
  const cards = { ...p.cards };
  let changed = false;
  for (const id of ids) if (!cards[id]) { cards[id] = newCard(now); changed = true; }
  return changed ? { ...p, cards, updatedAt: now } : p;
}

/** Consecutive days ending today or yesterday. Missing a day only resets the count — no guilt. */
export function benchDays(p: Progress, now: number): number {
  const set = new Set(p.days);
  let n = 0;
  const d = new Date(now);
  if (!set.has(today(+d))) d.setDate(d.getDate() - 1);
  while (set.has(today(+d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
