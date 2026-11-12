// Cross-device sync through one private GitHub Gist. The token (gist scope only) stays
// on this device in IndexedDB; it is only ever sent to api.github.com.
import { merge } from "@/engine/merge";
import type { Progress } from "@/engine/types";

const API = "https://api.github.com";
const FILE = "film-tutor-progress.json";
const DESC = "film tutor — progress sync (private, do not edit by hand)";

type Cfg = { token: string; gistId?: string };

async function gh(cfg: Cfg, path: string, init: RequestInit = {}) {
  const r = await fetch(API + path, {
    ...init,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${cfg.token}`, "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(r.status === 401 ? "github rejected the token" : `github said ${r.status}`);
  return r.json();
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
  const made = await gh(cfg, "/gists", { method: "POST", body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: JSON.stringify(local) } } }) });
  return made.id;
}

/** Pull, merge, push. Returns the merged progress and the gist id. */
export async function sync(cfg: Cfg, local: Progress): Promise<{ merged: Progress; gistId: string }> {
  const gistId = await findOrCreate(cfg, local);
  const g = await gh({ ...cfg, gistId }, `/gists/${gistId}`);
  const f = g.files?.[FILE];
  let remote: unknown = null;
  if (f) {
    const text: string = f.truncated ? await (await fetch(f.raw_url, { cache: "no-store" })).text() : f.content;
    try { remote = JSON.parse(text); } catch { remote = null; }
  }
  const merged = merge(local, remote);
  if (JSON.stringify(merged) !== JSON.stringify(remote)) {
    await gh({ ...cfg, gistId }, `/gists/${gistId}`, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(merged) } } }) });
  }
  return { merged, gistId };
}
