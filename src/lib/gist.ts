// Cross-device sync through your own GitHub gists. The token (gist scope only) stays on this
// device in IndexedDB and is only ever sent to api.github.com. With a passphrase, everything
// uploaded is encrypted first (lib/crypto.ts), so GitHub stores only ciphertext.
import { merge } from "@/engine/merge";
import type { PhotoRec, Progress } from "@/engine/types";
import { isSealed, seal, unseal } from "./crypto";
import { store, thumbFrom } from "./photos";

const API = "https://api.github.com";
const FILE = "film-tutor-progress.json";
const DESC = "film tutor — progress sync (private, do not edit by hand)";
const PHOTO_DESC = "film tutor — photos (private, do not edit by hand)";
const PER_SHARD = 12;

export type Cfg = { token: string; gistId?: string; pass?: string | null };

async function gh(cfg: Cfg, path: string, init: RequestInit = {}) {
  const r = await fetch(API + path, {
    ...init,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${cfg.token}`, "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(r.status === 401 ? "github rejected the token" : `github said ${r.status}`);
  return r.json();
}

async function fileText(f: { truncated?: boolean; raw_url: string; content: string }) {
  return f.truncated ? (await fetch(f.raw_url, { cache: "no-store" })).text() : f.content;
}

/** Find the sync gist on this account, or create it. */
export async function findOrCreate(cfg: Cfg, local: Progress): Promise<string> {
  if (cfg.gistId) return cfg.gistId;
  for (let page = 1; page <= 5; page++) {
    const list: { id: string; description: string; files: Record<string, unknown> }[] = await gh(cfg, `/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g.files[FILE]);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  const content = cfg.pass ? await seal(JSON.stringify(local), cfg.pass) : JSON.stringify(local);
  const made = await gh(cfg, "/gists", { method: "POST", body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content } } }) });
  return made.id;
}

/** Pull, merge, push. Returns the merged progress and the gist id. */
export async function sync(cfg: Cfg, local: Progress): Promise<{ merged: Progress; gistId: string }> {
  const gistId = await findOrCreate(cfg, local);
  const g = await gh({ ...cfg, gistId }, `/gists/${gistId}`);
  const f = g.files?.[FILE];
  let remote: unknown = null, sealed = false;
  if (f) {
    const raw = await fileText(f);
    sealed = isSealed(raw);
    try { remote = JSON.parse(await unseal(raw, cfg.pass ?? null)); } catch (e) { if ((e as Error).name !== "SyntaxError") throw e; remote = null; }
  }
  const merged = merge(local, remote);
  const changed = JSON.stringify(merged) !== JSON.stringify(remote);
  // also push when encryption was just switched on (or off)
  if (changed || sealed !== !!cfg.pass) {
    const content = cfg.pass ? await seal(JSON.stringify(merged), cfg.pass) : JSON.stringify(merged);
    await gh({ ...cfg, gistId }, `/gists/${gistId}`, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content } } }) });
  }
  return { merged, gistId };
}

// ─── photos: image bytes in shard gists of ~12, so no single response gets large ───

const fileName = (id: string) => `p-${id}.txt`;
const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

/**
 * Upload photos this device has that no shard holds yet; download photos other devices
 * uploaded that this device lacks; remove deleted ones from their shards. Returns shard
 * assignments to record in progress, and ids whose shard file was removed.
 */
export async function syncPhotos(cfg: Cfg, p: Progress): Promise<{ assigned: Record<string, string>; cleared: string[] }> {
  const recs = Object.values(p.photos);
  const have = await store.has();
  const assigned: Record<string, string> = {};

  // upload
  const counts = new Map<string, number>();
  for (const r of recs) if (r.shard && !r.deleted) counts.set(r.shard, (counts.get(r.shard) ?? 0) + 1);
  const todo = recs.filter((r) => !r.deleted && !r.url && !r.shard && have.has(r.id));
  for (const r of todo) {
    const blob = await store.get(r.id, "img");
    if (!blob) continue;
    const data = await blobToDataUrl(blob);
    const content = cfg.pass ? await seal(data, cfg.pass) : data;
    let shard = [...counts].find(([, n]) => n < PER_SHARD)?.[0];
    if (shard) await gh(cfg, `/gists/${shard}`, { method: "PATCH", body: JSON.stringify({ files: { [fileName(r.id)]: { content } } }) });
    else shard = (await gh(cfg, "/gists", { method: "POST", body: JSON.stringify({ description: PHOTO_DESC, public: false, files: { [fileName(r.id)]: { content } } }) })).id as string;
    counts.set(shard, (counts.get(shard) ?? 0) + 1);
    assigned[r.id] = shard;
  }

  // download, one shard request at a time
  const missing = recs.filter((r) => !r.deleted && !r.url && r.shard && !have.has(r.id));
  const byShard = new Map<string, PhotoRec[]>();
  for (const r of missing) byShard.set(r.shard!, [...(byShard.get(r.shard!) ?? []), r]);
  for (const [shard, rs] of byShard) {
    const g = await gh(cfg, `/gists/${shard}`).catch(() => null);
    if (!g) continue;
    for (const r of rs) {
      const f = g.files?.[fileName(r.id)];
      if (!f) continue;
      const data = await unseal(await fileText(f), cfg.pass ?? null);
      const blob = await (await fetch(data)).blob();
      await store.save(r.id, blob, await thumbFrom(blob));
    }
  }

  // deletions: drop local bytes, and the file from its shard
  const gone = recs.filter((r) => r.deleted && r.shard);
  const byGone = new Map<string, string[]>();
  for (const r of gone) { if (have.has(r.id)) await store.drop(r.id); byGone.set(r.shard!, [...(byGone.get(r.shard!) ?? []), r.id]); }
  for (const [shard, ids] of byGone) {
    const files = Object.fromEntries(ids.map((id) => [fileName(id), null]));
    await gh(cfg, `/gists/${shard}`, { method: "PATCH", body: JSON.stringify({ files }) }).catch(() => null);
  }
  return { assigned, cleared: gone.map((r) => r.id) };
}
