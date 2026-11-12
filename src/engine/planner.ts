import type { Progress, SkillNode, SubjectPack } from "./types";
import { statuses } from "./graph";
import { dueQueue } from "./progress";

export type Plan = {
  latent: SkillNode[];
  suggested: SkillNode[];
  due: number;
  learned: number;
  mastered: number;
};

/** What can be studied right now, with a suggestion: the lowest tiers first, spread across branches. */
export function plan(pack: SubjectPack, p: Progress, now: number): Plan {
  const st = statuses(pack, p);
  const latent = pack.nodes.filter((n) => st[n.id] === "latent").sort((a, b) => a.tier - b.tier);
  const seen = new Set<string>();
  const suggested: SkillNode[] = [];
  for (const n of latent) if (!seen.has(n.branch) && suggested.length < 3) { seen.add(n.branch); suggested.push(n); }
  for (const n of latent) if (suggested.length < 3 && !suggested.includes(n)) suggested.push(n);
  return {
    latent,
    suggested,
    due: dueQueue(pack, p, now).length,
    learned: Object.values(st).filter((s) => s === "learned" || s === "mastered").length,
    mastered: Object.values(st).filter((s) => s === "mastered").length,
  };
}
