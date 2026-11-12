// Authoring helpers so lessons read like prose rather than JSON.
import type { Block, Card, QuizItem } from "@/engine/types";

export const p = (text: string): Block => ({ kind: "p", text });
export const h = (text: string): Block => ({ kind: "h", text });
export const ul = (...items: string[]): Block => ({ kind: "list", items });
export const ol = (...items: string[]): Block => ({ kind: "list", items, ordered: true });
export const tip = (text: string): Block => ({ kind: "tip", text, tone: "note" });
export const warn = (text: string): Block => ({ kind: "tip", text, tone: "warn" });
/** a note specific to the owner's camera */
export const k1000 = (text: string): Block => ({ kind: "tip", text, tone: "gear" });
export const terms = (...items: [string, string][]): Block => ({ kind: "terms", items });
export const widget = (widget: string, props?: Record<string, unknown>): Block => ({ kind: "widget", widget, props });

/** Build quiz items with ids namespaced by node. */
export function quiz(ns: string, ...items: ((id: string) => QuizItem)[]): QuizItem[] {
  return items.map((f, i) => f(`${ns}-q${i + 1}`));
}
export const choice = (q: string, options: string[], answer: number, why: string) =>
  (id: string): QuizItem => ({ id, kind: "choice", q, options, answer, why });
export const tf = (q: string, answer: boolean, why: string) =>
  (id: string): QuizItem => ({ id, kind: "truefalse", q, answer, why });
export const num = (q: string, answer: number, why: string, unit?: string, tolerance?: number) =>
  (id: string): QuizItem => ({ id, kind: "number", q, answer, why, unit, tolerance });

export function cards(ns: string, ...pairs: [string, string][]): Card[] {
  return pairs.map(([front, back], i) => ({ id: `${ns}-c${i + 1}`, front, back }));
}
