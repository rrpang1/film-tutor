"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { kv } from "./db";
import { sync as gistSync, syncPhotos } from "./gist";
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
  /** whether an end-to-end encryption passphrase is set on this device */
  encrypted: boolean;
  setPass: (pass: string | null) => Promise<void>;
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
  const [pass, setPassS] = useState<string | null>(null);
  const passRef = useRef<string | null>(null); passRef.current = pass;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    (async () => {
      const [saved, t, g, pw] = await Promise.all([kv.get<Progress>("progress"), kv.get<string>("gist-token"), kv.get<string>("gist-id"), kv.get<string>("sync-pass")]);
      if (pw) setPassS(pw);
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
      const cfg = { token: tok, gistId: gRef.current, pass: passRef.current };
      const { merged, gistId: id } = await gistSync(cfg, pRef.current);
      // merge again in case the user changed something while the request was in flight
      let m = merge(pRef.current, merged);
      setP((cur) => { m = merge(cur, merged); kv.set("progress", m); return m; });
      if (id !== gRef.current) { setGistId(id); kv.set("gist-id", id); }
      // then the photos' bytes; record which shard holds each new upload
      setSync((s) => ({ ...s, message: "photos…" }));
      const { assigned, cleared } = await syncPhotos({ ...cfg, gistId: id }, m);
      if (Object.keys(assigned).length || cleared.length) {
        const now = Date.now();
        setP((cur) => {
          const photos = { ...cur.photos };
          for (const [pid, shard] of Object.entries(assigned)) if (photos[pid]) photos[pid] = { ...photos[pid], shard, updatedAt: now };
          for (const pid of cleared) if (photos[pid]) photos[pid] = { ...photos[pid], shard: undefined, updatedAt: now };
          const next = { ...cur, photos, updatedAt: now };
          kv.set("progress", next);
          return next;
        });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => syncNow(), 1500);
      }
      setSync({ status: "idle", at: Date.now(), message: undefined });
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

  const setPass = useCallback(async (pw: string | null) => {
    if (pw) await kv.set("sync-pass", pw); else await kv.del("sync-pass");
    setPassS(pw); passRef.current = pw;
    syncNow();
  }, [syncNow]);

  const value = useMemo<Ctx>(() => ({
    ready, p, update, ceremonies,
    celebrate: (c) => setCer((x) => [...x, c]),
    dismiss: () => setCer((x) => x.slice(1)),
    syncState, token, setToken, syncNow, replace, encrypted: !!pass, setPass,
  }), [ready, p, update, ceremonies, syncState, token, setToken, syncNow, replace, pass, setPass]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
