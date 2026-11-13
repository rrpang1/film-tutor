import { z } from "zod";
import type { SubjectPack } from "./types";
import { validateGraph } from "./graph";

const block = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("p"), text: z.string().min(1) }),
  z.object({ kind: z.literal("h"), text: z.string().min(1) }),
  z.object({ kind: z.literal("list"), items: z.array(z.string()).min(1), ordered: z.boolean().optional() }),
  z.object({ kind: z.literal("tip"), text: z.string(), tone: z.enum(["note", "warn", "gear"]).optional() }),
  z.object({ kind: z.literal("terms"), items: z.array(z.tuple([z.string(), z.string()])).min(1) }),
  z.object({ kind: z.literal("widget"), widget: z.string(), props: z.record(z.string(), z.unknown()).optional() }),
]);
const quiz = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("choice"), q: z.string(), options: z.array(z.string()).min(2), answer: z.number().int(), why: z.string().min(1) })
    .refine((x) => x.answer >= 0 && x.answer < x.options.length, "answer out of range"),
  z.object({ id: z.string(), kind: z.literal("truefalse"), q: z.string(), answer: z.boolean(), why: z.string().min(1) }),
  z.object({ id: z.string(), kind: z.literal("number"), q: z.string(), answer: z.number(), tolerance: z.number().optional(), unit: z.string().optional(), why: z.string().min(1) }),
]);
const card = z.object({ id: z.string(), front: z.string().min(1), back: z.string().min(1) });
const node = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  branch: z.string(), tier: z.number().int().min(0), title: z.string(), blurb: z.string(),
  prereqs: z.array(z.string()),
  gate: z.object({ level: z.number().optional(), logs: z.number().optional(), critiques: z.number().optional() }).optional(),
  xp: z.number().int().positive(), minutes: z.number().positive(),
  lesson: z.array(block).min(1), quiz: z.array(quiz).min(1), cards: z.array(card),
  assignment: z.object({ id: z.string(), title: z.string(), brief: z.string(), checklist: z.array(z.string()).min(1), frames: z.number().optional() }).optional(),
});
const packSchema = z.object({
  id: z.string(), title: z.string(), unit: z.tuple([z.string(), z.string()]), levelWord: z.string(),
  branches: z.array(z.object({ id: z.string(), title: z.string(), blurb: z.string(), hue: z.string().optional() })).min(1),
  nodes: z.array(node).min(1),
  ranks: z.array(z.object({ level: z.number(), title: z.string(), line: z.string() })).min(1),
  library: z.array(z.object({
    id: z.string(), kind: z.enum(["photographer", "book"]), name: z.string(), years: z.string(), by: z.string().optional(),
    tags: z.array(z.string()), summary: z.string(), lookFor: z.array(z.string()), prompts: z.array(z.string()),
    works: z.array(z.string()).optional(), related: z.array(z.string()).optional(), unlockedBy: z.string().optional(),
  })),
  critiques: z.array(z.object({
    id: z.string(), title: z.string(), by: z.string(), year: z.string(), search: z.string(), context: z.string(),
    model: z.object({ describe: z.string(), analyze: z.string(), interpret: z.string(), judge: z.string() }),
    vocabulary: z.array(z.string()), unlockedBy: z.string().optional(),
  })),
  glossary: z.array(card),
});

/** Full structural + referential check. Run in tests (and so in CI/build). */
export function validatePack(pack: SubjectPack): void {
  packSchema.parse(pack);
  validateGraph(pack.nodes);
  const branches = new Set(pack.branches.map((b) => b.id));
  const nodeIds = new Set(pack.nodes.map((n) => n.id));
  const ids = new Set<string>();
  const unique = (id: string, where: string) => { if (ids.has(id)) throw new Error(`duplicate id ${id} (${where})`); ids.add(id); };
  for (const n of pack.nodes) {
    if (!branches.has(n.branch)) throw new Error(`${n.id}: unknown branch ${n.branch}`);
    n.quiz.forEach((q) => unique(q.id, n.id));
    n.cards.forEach((c) => unique(c.id, n.id));
    if (n.assignment) unique(n.assignment.id, n.id);
    for (const b of n.lesson) if (b.kind === "widget" && !KNOWN_WIDGETS.has(b.widget)) throw new Error(`${n.id}: unknown widget ${b.widget}`);
  }
  pack.glossary.forEach((c) => unique(c.id, "glossary"));
  for (const e of [...pack.library, ...pack.critiques]) {
    unique(e.id, "library/critique");
    if (e.unlockedBy && !nodeIds.has(e.unlockedBy)) throw new Error(`${e.id}: unlockedBy unknown node ${e.unlockedBy}`);
  }
  for (const e of pack.library) for (const r of e.related ?? [])
    if (!pack.library.some((x) => x.id === r)) throw new Error(`${e.id}: related unknown ${r}`);
}

/** Interactive widgets lessons may embed. The UI maps these names to components. */
export const KNOWN_WIDGETS = new Set(["exposure-sim", "sunny16", "stops-ladder", "zone-scale", "dof", "rule-of-thirds", "develop"]);
