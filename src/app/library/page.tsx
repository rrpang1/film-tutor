"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sheet from "@/components/Sheet";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { award } from "@/engine/progress";
import type { LibraryEntry } from "@/engine/types";

const searchUrl = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

export default function Library() {
  const { p } = useStore();
  const [open, setOpen] = useState<LibraryEntry | null>(null);
  const [tab, setTab] = useState<"photographer" | "book">("photographer");
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("open");
    const e = pack.library.find((x) => x.id === id);
    if (e) { setOpen(e); setTab(e.kind); history.replaceState(null, "", location.pathname); }
  }, []);
  const avail = (e: LibraryEntry) => !e.unlockedBy || !!p.nodes[e.unlockedBy]?.learnedAt;
  const list = pack.library.filter((e) => e.kind === tab).sort((a, b) => Number(avail(b)) - Number(avail(a)));
  const studied = pack.library.filter((e) => p.library[e.id]?.studied).length;

  return (
    <div className="page">
      <header className="pagehead">
        <div>
          <h1 className="display lift">the library</h1>
          <p className="lift">the photographers and photobooks worth knowing. They arrive as you develop the history and critique frames, so each one lands with context.</p>
        </div>
        <span className="chip">{studied} studied</span>
      </header>
      <div className="tabs" role="tablist">
        {(["photographer", "book"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`chip${tab === t ? " live" : ""}`} onClick={() => setTab(t)}>{t === "book" ? "photobooks & texts" : "photographers"}</button>
        ))}
      </div>

      {tab === "photographer" ? (
        <div className="wall">
          {list.map((e, k) => {
            const ok = avail(e);
            return (
              <motion.button key={e.id} className={`print paper${ok ? "" : " unexposed"}${p.library[e.id]?.studied ? " studied" : ""}`}
                style={{ rotate: ((k * 37) % 7) - 3 }} onClick={() => ok && setOpen(e)} disabled={!ok}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: ok ? 1 : 0.55, y: 0 }} transition={{ delay: (k % 6) * 0.05, duration: 0.6 }}
                whileHover={ok ? { y: -6, rotate: 0, scale: 1.03 } : undefined}>
                <span className="print-img"><span className="display">{e.name.split(" ").map((w) => w[0]).join("").toLowerCase()}</span></span>
                <span className="print-cap"><b>{ok ? e.name : "unexposed"}</b><span className="muted">{ok ? e.years : `after “${pack.nodes.find((n) => n.id === e.unlockedBy)?.title}”`}</span></span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="shelf">
          {list.map((e, k) => {
            const ok = avail(e);
            return (
              <motion.button key={e.id} className={`spine${ok ? "" : " unexposed"}${p.library[e.id]?.studied ? " studied" : ""}`} onClick={() => ok && setOpen(e)} disabled={!ok}
                style={{ height: 190 + ((k * 53) % 70), ["--hue" as string]: (k * 47) % 360 }}
                whileHover={ok ? { y: -14 } : undefined} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <span className="spine-t">{ok ? e.name.replace(/\s*\(.*\)/, "") : "unexposed"}</span>
                <span className="spine-y">{ok ? e.years.slice(0, 4) : ""}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      <Sheet open={!!open} onClose={() => setOpen(null)} label={open?.name ?? "entry"}>
        {open && <Entry e={open} onPick={(x) => { setOpen(x); setTab(x.kind); }} />}
      </Sheet>
    </div>
  );
}

function Entry({ e, onPick }: { e: LibraryEntry; onPick: (e: LibraryEntry) => void }) {
  const { p, update } = useStore();
  const rec = p.library[e.id];
  const [notes, setNotes] = useState(rec?.notes ?? "");
  const markStudied = () => update((cur) => award({ ...cur, library: { ...cur.library, [e.id]: { ...cur.library[e.id], studied: Date.now(), notes, updatedAt: Date.now() } } }, `lib:${e.id}`, 3, `studied ${e.name}`, Date.now()));
  const saveNotes = () => update((cur) => ({ ...cur, library: { ...cur.library, [e.id]: { ...cur.library[e.id], notes, updatedAt: Date.now() } }, updatedAt: Date.now() }));
  const related = (e.related ?? []).map((id) => pack.library.find((x) => x.id === id)!).filter(Boolean);
  return (
    <div className="entry">
      <span className="muted">{e.kind === "book" ? `${e.by}, ${e.years}` : e.years}</span>
      <h2 className="display" style={{ fontSize: "var(--t-xl)", margin: "6px 0 12px" }}>{e.name}</h2>
      <p>{e.summary}</p>
      <h3 className="display">what to look for</h3>
      <ul>{e.lookFor.map((x) => <li key={x}>{x}</li>)}</ul>
      {e.works && <><h3 className="display">start with</h3><ul>{e.works.map((w) => <li key={w}><a href={searchUrl(`${e.kind === "book" ? e.by : e.name} ${w}`)} target="_blank" rel="noreferrer">{w}</a></li>)}</ul></>}
      <h3 className="display">think about</h3>
      <ul>{e.prompts.map((x) => <li key={x}>{x}</li>)}</ul>
      <div className="entry-actions">
        <a className="btn ghost" href={searchUrl(e.kind === "book" ? `${e.name} ${e.by} photobook` : `${e.name} photographer`)} target="_blank" rel="noreferrer">look at the work</a>
        {!rec?.studied ? <button className="btn signal" onClick={markStudied}>mark as studied (+3)</button> : <span className="chip live">studied</span>}
      </div>
      <label style={{ display: "block", marginTop: 18 }}>
        <span className="field-label">your notes</span>
        <textarea className="input" value={notes} onChange={(x) => setNotes(x.target.value)} onBlur={saveNotes} placeholder="what you noticed, what you'd steal" />
      </label>
      {related.length > 0 && (
        <p style={{ marginTop: 14 }}>see also: {related.map((r) => <button key={r.id} className="chip" style={{ marginRight: 6 }} onClick={() => onPick(r)}>{r.name}</button>)}</p>
      )}
      {e.kind === "book" && <p className="muted" style={{ fontSize: "var(--t-s)" }}>Libraries often hold these. Ask for the book by title, or look for a reissue. Once you&apos;ve read it, <Link href="/loupe/">write about it in the loupe</Link>.</p>}
    </div>
  );
}
