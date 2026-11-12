"use client";
// "today's roll": the frames the owner chose for this sitting. Per-device and disposable,
// so it lives in localStorage rather than synced progress.
export type Session = { ids: string[]; reviews: boolean; at: number };
const KEY = "ft-session";

export function getSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Session | null;
    return s && Date.now() - s.at < 18 * 3600_000 ? s : null;
  } catch { return null; }
}
export function setSession(s: Session | null) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {}
}
/** The next frame in today's roll after `id` that isn't learned yet. */
export function nextInSession(id: string | null, learned: (id: string) => boolean): string | null {
  const s = getSession();
  if (!s) return null;
  const rest = id ? s.ids.slice(s.ids.indexOf(id) + 1) : s.ids;
  return rest.find((x) => !learned(x)) ?? null;
}
