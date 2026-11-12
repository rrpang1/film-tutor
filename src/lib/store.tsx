"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { kv } from "./db";
import { sync as gistSync } from "./gist";
import { emptyProgress, migrate } from "@/engine/progress";
import { merge } from "@/engine/merge";
import { levelFromXp, totalXp } from "@/engine/xp";
import type { Progress, SkillNode } from "@/engine/types";

export type Ceremony =
  | { kind: "develop"; node: SkillNode; unlocked: SkillNode[]; gained: number }
  | { kind: "level"; level: number }
  | { kind: "toast"; text: string };

type SyncState = { status: "off" | "idle" | "syncing" | "error"; at?: number; message?: string };

type Ctx = {
  ready: boolean;
  p: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  ceremonies: Ceremony[];
  celebrate: (c: Ceremony) => void;
  dismiss: () => void;
  syncState: SyncState;
  token: string | null;
  setToken: (t: string | null) => Promise<void>;
  syncNow: () => Promise<void>;
  replace: (p: Progress) => void;
};

const C = createContext<Ctx | null>(null);
export const useStore = () => useContext(C)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(() => emptyProgress(0));
  const [ready, setReady] = useState(false);
  const [ceremonies, setCer] = useState<Ceremony[]>([]);
  const [token, setTok] = useState<string | null>(null);
  const [gistId, setGistId] = useState<string | undefined>();
  const [syncState, setSync] = useState<SyncState>({ status: "off" });
  const pRef = useRef(p); pRef.current = p;
  const tRef = useRef<string | null>(null); tRef.current = token;
  const gRef = useRef<string | undefined>(undefined); gRef.current = gistId;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    (async () => {
      const [saved, t, g] = await Promise.all([kv.get<Progress>("progress"), kv.get<string>("gist-token"), kv.get<string>("gist-id")]);
      setP(migrate(saved ?? emptyProgress()));
      if (t) { setTok(t); setSync({ status: "idle" }); }
      if (g) setGistId(g);
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  const syncNow = useCallback(async () => {
    const tok = tRef.current;
    if (!tok || busy.current) return;
    busy.current = true;
    setSync((s) => ({ ...s, status: "syncing" }));
    try {
      const { merged, gistId: id } = await gistSync({ token: tok, gistId: gRef.current }, pRef.current);
      // merge again in case the user changed something while the request was in flight
      setP((cur) => { const m = merge(cur, merged); kv.set("progress", m); return m; });
      if (id !== gRef.current) { setGistId(id); kv.set("gist-id", id); }
      setSync({ status: "idle", at: Date.now() });
    } catch (e) {
      setSync({ status: "error", at: Date.now(), message: (e as Error).message });
    } finally { busy.current = false; }
  }, []);

  // pull on start and whenever the app comes back into view
  useEffect(() => {
    if (!ready || !token) return;
    syncNow();
    const onVis = () => document.visibilityState === "visible" && syncNow();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [ready, token, syncNow]);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setP((cur) => {
      const next = fn(cur);
      if (next === cur) return cur;
      const before = levelFromXp(totalXp(cur)).level, after = levelFromXp(totalXp(next)).level;
      if (after > before) setTimeout(() => setCer((c) => [...c, { kind: "level", level: after }]), 50);
      kv.set("progress", next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => syncNow(), 4000);
      return next;
    });
  }, [syncNow]);

  const replace = useCallback((np: Progress) => { const m = migrate(np); setP(m); kv.set("progress", m); }, []);

  const setToken = useCallback(async (t: string | null) => {
    if (t) { await kv.set("gist-token", t); setTok(t); setSync({ status: "idle" }); }
    else { await kv.del("gist-token"); await kv.del("gist-id"); setTok(null); setGistId(undefined); setSync({ status: "off" }); }
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready, p, update, ceremonies,
    celebrate: (c) => setCer((x) => [...x, c]),
    dismiss: () => setCer((x) => x.slice(1)),
    syncState, token, setToken, syncNow, replace,
  }), [ready, p, update, ceremonies, syncState, token, setToken, syncNow, replace]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
