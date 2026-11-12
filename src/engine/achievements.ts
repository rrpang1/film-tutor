import type { Progress, SubjectPack } from "./types";
import { statuses } from "./graph";
import { benchDays } from "./progress";

export type Achievement = { id: string; title: string; line: string; got: boolean };

/** Derived, never stored: they can't drift out of sync between devices. */
export function achievements(pack: SubjectPack, p: Progress, now: number): Achievement[] {
  const st = statuses(pack, p);
  const learned = (b?: string) => pack.nodes.filter((n) => (!b || n.branch === b) && (st[n.id] === "learned" || st[n.id] === "mastered")).length;
  const logs = Object.values(p.logs).filter((l) => !l.deleted).length;
  const crits = Object.values(p.critiques).filter((c) => !c.deleted).length;
  const studied = Object.values(p.library).filter((l) => l.studied).length;
  const mastered = Object.values(st).filter((s) => s === "mastered").length;
  const list: (Omit<Achievement, "got"> & { test: boolean })[] = [];
  const add = (id: string, title: string, line: string, test: boolean) => list.push({ id, title, line, test });
  add("first-frame", "first frame", "developed your first skill", learned() >= 1);
  add("ten-frames", "a strip of ten", "ten skills developed", learned() >= 10);
  add("first-roll", "in the can", "logged your first real roll", logs >= 1);
  add("five-rolls", "a sleeve of negatives", "five rolls logged", logs >= 5);
  add("first-read", "first reading", "wrote your first critique", crits >= 1);
  add("canon", "the shelf", "studied five photographers or books", studied >= 5);
  add("keeper", "a keeper", "mastered a skill (three-week recall)", mastered >= 1);
  add("week", "a week at the bench", "seven days in a row", benchDays(p, now) >= 7);
  for (const b of pack.branches) {
    const total = pack.nodes.filter((n) => n.branch === b.id).length;
    if (total) add(`branch-${b.id}`, `${b.title}, complete`, `every ${b.title} frame developed`, learned(b.id) === total);
  }
  return list.map(({ test, ...a }) => ({ ...a, got: test }));
}
