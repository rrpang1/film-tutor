import type { Progress, SkillNode, SubjectPack } from "./types";
import { isMature } from "./srs";
import { levelFromXp, totalXp } from "./xp";

export type Status = "locked" | "latent" | "learned" | "mastered";
export const PASS = 0.8;

/** Throws on unknown prereq ids, duplicate ids, or cycles. */
export function validateGraph(nodes: SkillNode[]): void {
  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) throw new Error(`duplicate node id: ${n.id}`);
    ids.add(n.id);
  }
  for (const n of nodes) for (const p of n.prereqs)
    if (!ids.has(p)) throw new Error(`${n.id} needs unknown prereq ${p}`);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) throw new Error(`cycle: ${[...path, id].join(" → ")}`);
    state.set(id, 1);
    for (const p of byId.get(id)!.prereqs) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const n of nodes) visit(n.id, []);
}

export type Missing = { prereqs: string[]; level?: number; logs?: number; critiques?: number };

export function missingFor(n: SkillNode, p: Progress): Missing {
  const m: Missing = { prereqs: n.prereqs.filter((id) => !p.nodes[id]?.learnedAt) };
  const g = n.gate;
  if (g?.level && levelFromXp(totalXp(p)).level < g.level) m.level = g.level;
  const logs = Object.values(p.logs).filter((l) => !l.deleted).length;
  if (g?.logs && logs < g.logs) m.logs = g.logs - logs;
  const crits = Object.values(p.critiques).filter((c) => !c.deleted).length;
  if (g?.critiques && crits < g.critiques) m.critiques = g.critiques - crits;
  return m;
}

const isEmpty = (m: Missing) => !m.prereqs.length && !m.level && !m.logs && !m.critiques;

export function statusOf(n: SkillNode, p: Progress): Status {
  if (p.nodes[n.id]?.learnedAt) {
    return n.cards.length && n.cards.every((c) => isMature(p.cards[c.id])) ? "mastered" : "learned";
  }
  return isEmpty(missingFor(n, p)) ? "latent" : "locked";
}

export function statuses(pack: SubjectPack, p: Progress): Record<string, Status> {
  return Object.fromEntries(pack.nodes.map((n) => [n.id, statusOf(n, p)]));
}

/** Nodes that become latent if `id` were learned now — the "new frames exposed" list. */
export function wouldUnlock(pack: SubjectPack, p: Progress, id: string, now: number): SkillNode[] {
  const before = statuses(pack, p);
  const next: Progress = { ...p, nodes: { ...p.nodes, [id]: { attempts: 1, learnedAt: now, updatedAt: now } } };
  return pack.nodes.filter((n) => n.id !== id && before[n.id] === "locked" && statusOf(n, next) === "latent");
}
