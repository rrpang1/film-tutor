import { describe, expect, it } from "vitest";
import { validateGraph, statusOf, wouldUnlock } from "./graph";
import { levelFromXp, rollLength } from "./xp";
import { review, newCard, interleave } from "./srs";
import { emptyProgress, recordProof, gradeCard, benchDays, award } from "./progress";
import { merge } from "./merge";
import type { SkillNode, SubjectPack } from "./types";

const node = (id: string, prereqs: string[] = [], extra: Partial<SkillNode> = {}): SkillNode => ({
  id, branch: "b", tier: 0, title: id, blurb: "", prereqs, xp: 10, minutes: 5,
  lesson: [{ kind: "p", text: "x" }], quiz: [{ id: `${id}-q`, kind: "truefalse", q: "?", answer: true, why: "y" }],
  cards: [{ id: `${id}-c`, front: "f", back: "b" }], ...extra,
});
const pack = (nodes: SkillNode[]): SubjectPack => ({
  id: "t", title: "t", unit: ["frame", "frames"], levelWord: "roll", branches: [{ id: "b", title: "b", blurb: "" }],
  nodes, ranks: [{ level: 1, title: "r", line: "" }], library: [], critiques: [], glossary: [],
});

describe("graph", () => {
  it("rejects unknown prereqs and cycles", () => {
    expect(() => validateGraph([node("a", ["zz"])])).toThrow(/unknown/);
    expect(() => validateGraph([node("a", ["b"]), node("b", ["a"])])).toThrow(/cycle/);
    expect(() => validateGraph([node("a"), node("b", ["a"])])).not.toThrow();
  });
  it("walks locked → latent → learned → mastered", () => {
    const pk = pack([node("a"), node("b", ["a"])]);
    let p = emptyProgress(0);
    expect(statusOf(pk.nodes[1], p)).toBe("locked");
    expect(wouldUnlock(pk, p, "a", 1).map((n) => n.id)).toEqual(["b"]);
    p = recordProof(pk, p, "a", 1, true, 1);
    expect(statusOf(pk.nodes[0], p)).toBe("learned");
    expect(statusOf(pk.nodes[1], p)).toBe("latent");
    p = { ...p, cards: { "a-c": { ...newCard(0), interval: 30 } } };
    expect(statusOf(pk.nodes[0], p)).toBe("mastered");
  });
  it("respects field gates", () => {
    const pk = pack([node("a", [], { gate: { logs: 1 } })]);
    expect(statusOf(pk.nodes[0], emptyProgress(0))).toBe("locked");
  });
});

describe("xp", () => {
  it("rolls get longer and cap at 72", () => {
    expect(rollLength(1)).toBe(24);
    expect(rollLength(3)).toBe(36);
    expect(rollLength(50)).toBe(72);
    expect(levelFromXp(0)).toMatchObject({ level: 1, into: 0 });
    expect(levelFromXp(24)).toMatchObject({ level: 2, into: 0, length: 30 });
    expect(levelFromXp(60)).toMatchObject({ level: 3, into: 6 });
  });
  it("never double-awards an event", () => {
    let p = award(emptyProgress(0), "x", 5, "", 0);
    p = award(p, "x", 5, "", 0);
    expect(p.xp).toHaveLength(1);
  });
  it("re-passing a proof earns nothing", () => {
    const pk = pack([node("a")]);
    let p = recordProof(pk, emptyProgress(0), "a", 1, true, 1);
    p = recordProof(pk, p, "a", 1, true, 2);
    expect(p.xp).toHaveLength(1);
  });
});

describe("srs", () => {
  it("grows intervals and resets on again", () => {
    let c = newCard(0);
    c = review(c, "good", 0); expect(c.interval).toBe(1);
    c = review(c, "good", 0); expect(c.interval).toBe(6);
    c = review(c, "good", 0); expect(c.interval).toBeGreaterThan(12);
    c = review(c, "again", 0); expect(c.interval).toBe(0); expect(c.lapses).toBe(1);
  });
  it("interleaves groups", () => {
    const out = interleave(["a1", "a2", "a3", "b1", "b2"], (s) => s[0]);
    expect(out.slice(0, 4)).toEqual(["a1", "b1", "a2", "b2"]);
  });
  it("one frame per card per day", () => {
    let p = gradeCard(emptyProgress(0), "c", "good", 1000);
    p = gradeCard(p, "c", "good", 2000);
    expect(p.xp).toHaveLength(1);
  });
});

describe("merge", () => {
  it("unions xp and takes newest records", () => {
    const a = award({ ...emptyProgress(0), nodes: { n: { attempts: 1, updatedAt: 5 } } }, "e1", 3, "", 1);
    const b = award({ ...emptyProgress(0), nodes: { n: { attempts: 2, updatedAt: 9 } } }, "e2", 4, "", 2);
    const m = merge(a, b);
    expect(m.xp.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(m.nodes.n.attempts).toBe(2);
    expect(merge(m, m)).toEqual(m);
  });
  it("survives garbage", () => {
    expect(merge(null, "nope").xp).toEqual([]);
  });
});

describe("bench days", () => {
  it("counts a run ending today or yesterday", () => {
    const now = new Date(2026, 10, 12, 12).getTime();
    const p = { ...emptyProgress(0), days: ["2026-11-09", "2026-11-10", "2026-11-11"] };
    expect(benchDays(p, now)).toBe(3);
    expect(benchDays({ ...p, days: ["2026-11-01"] }, now)).toBe(0);
  });
});
