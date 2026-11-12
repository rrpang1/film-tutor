import { describe, expect, it } from "vitest";
import { validatePack } from "./pack";
import { packs } from "@/lib/packs";
import { statuses } from "./graph";
import { emptyProgress } from "./progress";

describe.each(Object.values(packs))("pack $id", (pack) => {
  it("is structurally and referentially valid", () => {
    expect(() => validatePack(pack)).not.toThrow();
  });
  it("has something to study on day one", () => {
    const st = statuses(pack, emptyProgress(0));
    expect(Object.values(st).filter((s) => s === "latent").length).toBeGreaterThanOrEqual(3);
  });
  it("every node is reachable", () => {
    // learn everything greedily with unlimited xp/logs/critiques and confirm nothing stays locked
    let p = emptyProgress(0);
    p = { ...p, xp: [{ id: "x", at: 0, amount: 1e6, reason: "" }],
      logs: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`l${i}`, { id: `l${i}`, date: "", camera: "", stock: "", iso: 0, title: "", frames: [], checklist: {}, links: [], updatedAt: 0 }])),
      critiques: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`c${i}`, { id: `c${i}`, subject: "", answers: { describe: "", analyze: "", interpret: "", judge: "" }, at: 0, updatedAt: 0 }])) };
    for (let round = 0; round < pack.nodes.length; round++) {
      const st = statuses(pack, p);
      for (const n of pack.nodes) if (st[n.id] === "latent") p = { ...p, nodes: { ...p.nodes, [n.id]: { attempts: 1, learnedAt: 1, updatedAt: 1 } } };
    }
    const locked = Object.entries(statuses(pack, p)).filter(([, s]) => s === "locked").map(([id]) => id);
    expect(locked).toEqual([]);
  });
});
