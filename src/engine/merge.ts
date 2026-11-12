import type { Progress } from "./types";
import { migrate } from "./progress";

type Stamped = { updatedAt: number };

function lww<T extends Stamped>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [k, v] of Object.entries(b)) if (!out[k] || v.updatedAt > out[k].updatedAt) out[k] = v;
  return out;
}

/**
 * Merge two devices' progress. XP is an append-only event log (union by id), so earned
 * frames are never lost. Every other record is last-write-wins by updatedAt.
 */
export function merge(aRaw: unknown, bRaw: unknown): Progress {
  const a = migrate(aRaw), b = migrate(bRaw);
  const xp = new Map(a.xp.map((e) => [e.id, e]));
  for (const e of b.xp) if (!xp.has(e.id)) xp.set(e.id, e);
  return {
    schemaVersion: a.schemaVersion,
    nodes: lww(a.nodes, b.nodes),
    cards: lww(a.cards, b.cards),
    xp: [...xp.values()].sort((x, y) => x.at - y.at),
    logs: lww(a.logs, b.logs),
    library: lww(a.library, b.library),
    critiques: lww(a.critiques, b.critiques),
    days: [...new Set([...a.days, ...b.days])].sort(),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}
