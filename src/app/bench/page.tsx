"use client";
import { useEffect, useRef, useState } from "react";
import Float from "@/components/Float";
import { useStore } from "@/lib/store";
import { merge } from "@/engine/merge";
import { emptyProgress } from "@/engine/progress";

/** Settings: sync across devices through a private gist, backups, reset. */
export default function Bench() {
  const { p, token, setToken, syncNow, syncState, replace, encrypted, setPass } = useStore();
  const [draft, setDraft] = useState("");
  const [pw, setPw] = useState(""), [pw2, setPw2] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android" | "mac" | "windows" | "other">("other");
  const [installed, setInstalled] = useState(false);
  const prompt = useRef<(Event & { prompt: () => Promise<void> }) | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(ua) ? "android" : /Macintosh/.test(ua) ? "mac" : /Windows/.test(ua) ? "windows" : "other");
    setInstalled(matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    const on = (e: Event) => { e.preventDefault(); prompt.current = e as Event & { prompt: () => Promise<void> }; setCanPrompt(true); };
    addEventListener("beforeinstallprompt", on);
    return () => removeEventListener("beforeinstallprompt", on);
  }, []);
  const photoCount = Object.values(p.photos).filter((x) => !x.deleted).length;
  const file = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(p, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `film-tutor-${new Date().toLocaleDateString("en-CA")}.json`;
    a.click();
  };
  const importJson = async (f: File) => {
    try { replace(merge(p, JSON.parse(await f.text()))); alert("Imported and merged with this device's progress."); }
    catch { alert("That file isn't a film tutor backup."); }
  };

  return (
    <div className="page bench">
      <header className="pagehead">
        <div>
          <h1 className="display lift">the bench</h1>
          <p className="lift">sync, backups and the like. Your progress lives on this device first, so the app works offline.</p>
        </div>
      </header>

      <Float speed={0.03} className="paper benchcard">
        <h2 className="display">sync across your devices</h2>
        {token ? (
          <>
            <p>Syncing to a secret gist on your GitHub account{encrypted ? ", encrypted" : ""}. {syncState.status === "syncing" ? `Syncing ${syncState.message ?? "now"}…` : syncState.status === "error" ? `Last sync failed: ${syncState.message}.` : syncState.at ? `Last synced ${new Date(syncState.at).toLocaleTimeString()}.` : ""}</p>
            <div className="formfoot" style={{ justifyContent: "flex-start" }}>
              <button className="btn signal" onClick={syncNow}>sync now</button>
              <button className="btn ghost" onClick={() => confirm("Stop syncing on this device? Your progress stays here and in the gist.") && setToken(null)}>stop syncing here</button>
            </div>
          </>
        ) : (
          <>
            <p>Free, with no server: your progress and photos are saved to secret gists on your own GitHub account. Do this once on each device (computer, laptop, phone).</p>
            <ol>
              <li>Sign in to GitHub and open <a href="https://github.com/settings/tokens/new?scopes=gist&description=film%20tutor%20sync" target="_blank" rel="noreferrer">new personal access token (classic)</a>. The link pre-selects only the <b>gist</b> scope.</li>
              <li>Set expiration to &ldquo;no expiration&rdquo; (or a long one), generate, and copy the token.</li>
              <li>Paste it below. The token stays on this device and is only ever sent to GitHub.</li>
            </ol>
            <form className="linkadd" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setToken(draft.trim()); setDraft(""); } }}>
              <input className="input" type="password" autoComplete="off" placeholder="ghp_…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="github token" />
              <button className="btn ink" disabled={!draft.trim()}>start syncing</button>
            </form>
          </>
        )}
      </Float>

      <Float speed={0.04} className="brushed benchcard">
        <h2 className="display">end-to-end encryption</h2>
        {encrypted ? (
          <>
            <p>On. Your progress and photos are encrypted on this device before they go to GitHub, which only ever stores ciphertext. Use the same passphrase on every device.</p>
            <button className="btn ghost" onClick={() => confirm("Turn encryption off on this device? Future syncs from here will upload readable data.") && setPass(null)}>turn off on this device</button>
          </>
        ) : (
          <>
            <p className="muted">A secret gist is unlisted, not private: anyone who has its link can read it. Set a passphrase and everything is encrypted (AES-GCM) on your device first. The passphrase never leaves the device and can't be recovered, so write it down somewhere safe.</p>
            <form className="formgrid" onSubmit={(e) => { e.preventDefault(); if (pw.length >= 8 && pw === pw2) { setPass(pw); setPw(""); setPw2(""); } }}>
              <label>passphrase (8+ characters)<input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
              <label>again<input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
              <div className="formfoot" style={{ gridColumn: "1 / -1", justifyContent: "flex-start" }}>
                <button className="btn ink" disabled={pw.length < 8 || pw !== pw2}>encrypt my sync</button>
                {pw2 && pw !== pw2 && <span className="muted">the two don&apos;t match</span>}
              </div>
            </form>
          </>
        )}
        {syncState.status === "error" && /passphrase/.test(syncState.message ?? "") && <p><b>{syncState.message}.</b></p>}
        <p className="muted">{photoCount} {photoCount === 1 ? "photo" : "photos"} on the wall. Photos sync in batches of twelve per gist, so no single download is large.</p>
      </Float>

      <Float speed={0.05} className="paper benchcard">
        <h2 className="display">install it</h2>
        {installed ? <p>You&apos;re using the installed app. It works offline; sync catches up when you&apos;re back online.</p> : (
          <p className="muted">Free on every device, no app store. It installs straight from the browser, runs offline, and updates itself.</p>
        )}
        {canPrompt && !installed && <button className="btn signal" onClick={async () => { await prompt.current?.prompt(); setCanPrompt(false); }}>install on this device</button>}
        <div className="install-steps">
          <div className={platform === "ios" ? "here" : ""}><b>iPhone / iPad</b>Open in Safari → Share → <i>Add to Home Screen</i>.</div>
          <div className={platform === "android" ? "here" : ""}><b>Android</b>Chrome → ⋮ menu → <i>Install app</i>.</div>
          <div className={platform === "mac" ? "here" : ""}><b>Mac</b>Safari → File → <i>Add to Dock</i>. Or in Chrome/Edge, the install icon in the address bar.</div>
          <div className={platform === "windows" ? "here" : ""}><b>Windows</b>Edge or Chrome → the install icon in the address bar (or ⋯ → Apps → <i>Install</i>). It then appears in the Start menu.</div>
        </div>
        <p className="muted">Then set up sync on each device with the same token (and passphrase, if you use one).</p>
      </Float>

      <Float speed={0.05} className="brushed benchcard">
        <h2 className="display">backups</h2>
        <p className="muted">A JSON file of everything: frames, cards, logs, critiques, notes. Importing merges with what&apos;s here and never overwrites newer work.</p>
        <div className="formfoot" style={{ justifyContent: "flex-start" }}>
          <button className="btn ink" onClick={exportJson}>download a backup</button>
          <button className="btn ghost" onClick={() => file.current?.click()}>import a backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
      </Float>

      <Float speed={0.04} className="paper benchcard">
        <h2 className="display">start over</h2>
        <p className="muted">Clears progress on this device only. If sync is on, the gist will merge it back. Stop syncing first if you really want a clean slate.</p>
        <button className="btn ghost" onClick={() => confirm("Erase all progress on this device?") && replace(emptyProgress())}>erase this device</button>
      </Float>
    </div>
  );
}
