"use client";
import { useRef, useState } from "react";
import Float from "@/components/Float";
import { useStore } from "@/lib/store";
import { merge } from "@/engine/merge";
import { emptyProgress } from "@/engine/progress";

/** Settings: sync across devices through a private gist, backups, reset. */
export default function Bench() {
  const { p, token, setToken, syncNow, syncState, replace } = useStore();
  const [draft, setDraft] = useState("");
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
            <p>Syncing to a private gist on your GitHub account. {syncState.status === "syncing" ? "Syncing now…" : syncState.status === "error" ? `Last sync failed: ${syncState.message}.` : syncState.at ? `Last synced ${new Date(syncState.at).toLocaleTimeString()}.` : ""}</p>
            <div className="formfoot" style={{ justifyContent: "flex-start" }}>
              <button className="btn signal" onClick={syncNow}>sync now</button>
              <button className="btn ghost" onClick={() => confirm("Stop syncing on this device? Your progress stays here and in the gist.") && setToken(null)}>stop syncing here</button>
            </div>
          </>
        ) : (
          <>
            <p>Free, with no server: your progress is saved to one private gist on your own GitHub account. Do this once on each device (computer, laptop, phone).</p>
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
