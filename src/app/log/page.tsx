"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Sheet from "@/components/Sheet";
import Float from "@/components/Float";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { award } from "@/engine/progress";
import type { LogRec } from "@/engine/types";
import { uid } from "@/lib/hooks";

const assignments = pack.nodes.filter((n) => n.assignment).map((n) => ({ ...n.assignment!, node: n.title }));
const BASE_CHECKS = ["checked the rewind knob turned", "set the ISO dial to the roll", "noted settings while shooting", "labelled the canister"];

const blank = (assignment?: string): LogRec => ({
  id: uid(), date: new Date().toLocaleDateString("en-CA"), camera: "Pentax K1000", stock: "", iso: 400, title: "",
  assignment, conditions: "", frames: [], checklist: {}, reflection: "", links: [], updatedAt: Date.now(),
});

export default function FieldLog() {
  const { p, update } = useStore();
  const [edit, setEdit] = useState<LogRec | null>(null);
  const logs = useMemo(() => Object.values(p.logs).filter((l) => !l.deleted).sort((a, b) => b.date.localeCompare(a.date)), [p.logs]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("new")) setEdit(blank(q.get("assignment") ?? undefined));
    const o = q.get("open");
    if (o && p.logs[o]) setEdit(p.logs[o]);
    if (q.toString()) history.replaceState(null, "", location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (l: LogRec) => {
    const now = Date.now();
    update((cur) => {
      let next = { ...cur, logs: { ...cur.logs, [l.id]: { ...l, updatedAt: now } }, updatedAt: now };
      next = award(next, `log:${l.id}`, 6, "logged a roll", now);
      if (l.assignment) next = award(next, `assign:${l.assignment}`, 10, "completed a field assignment", now);
      return next;
    });
    setEdit(null);
  };
  const remove = (l: LogRec) => {
    if (!confirm("Remove this roll from the log? Frames already earned stay.")) return;
    update((cur) => ({ ...cur, logs: { ...cur.logs, [l.id]: { ...l, deleted: true, updatedAt: Date.now() } } }));
    setEdit(null);
  };

  return (
    <div className="page">
      <header className="pagehead">
        <div>
          <h1 className="display lift">field log</h1>
          <p className="lift">every real roll you shoot. Settings, conditions, what you meant to do and what happened. Scans stay wherever you keep them; link them here.</p>
        </div>
        <button className="btn signal" onClick={() => setEdit(blank())} data-magnet>log a roll</button>
      </header>

      {logs.length === 0 && (
        <Float className="paper empty" speed={0.04}>
          <h2 className="display">no rolls yet.</h2>
          <p>Logging your first roll opens field-gated frames like &ldquo;latitude&rdquo;. A good first one is the assignment in &ldquo;metering with the needle&rdquo;.</p>
        </Float>
      )}

      <div className="sleeve-grid">
        {logs.map((l, k) => (
          <Float key={l.id} speed={0.03 + (k % 3) * 0.02} tilt={k % 2 ? 0.6 : -0.5}>
            <motion.button className="negsleeve" onClick={() => setEdit(l)} whileHover={{ y: -4 }}>
              <span className="neg-strip filmbase">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>
              <span className="neg-meta">
                <b>{l.title || "untitled roll"}</b>
                <span className="muted">{l.date}, {l.stock || "unknown stock"} at {l.iso}</span>
                {l.assignment && <span className="chip live">{assignments.find((a) => a.id === l.assignment)?.title}</span>}
              </span>
            </motion.button>
          </Float>
        ))}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} label="roll log">
        {edit && <LogEditor initial={edit} onSave={save} onRemove={p.logs[edit.id] ? () => remove(edit) : undefined} />}
      </Sheet>
    </div>
  );
}

function LogEditor({ initial, onSave, onRemove }: { initial: LogRec; onSave: (l: LogRec) => void; onRemove?: () => void }) {
  const [l, setL] = useState(initial);
  const set = <K extends keyof LogRec>(k: K, v: LogRec[K]) => setL((x) => ({ ...x, [k]: v }));
  const a = assignments.find((x) => x.id === l.assignment);
  const checks = [...BASE_CHECKS, ...(a?.checklist ?? [])];
  const [link, setLink] = useState("");
  return (
    <form className="logform" onSubmit={(e) => { e.preventDefault(); onSave(l); }}>
      <h2 className="display" style={{ margin: "0 0 16px", fontSize: "var(--t-xl)" }}>{initial.title ? "edit roll" : "log a roll"}</h2>
      <div className="row2">
        <label><span className="field-label">title</span><input className="input" value={l.title} onChange={(e) => set("title", e.target.value)} placeholder="first metered roll" /></label>
        <label><span className="field-label">date</span><input className="input" type="date" value={l.date} onChange={(e) => set("date", e.target.value)} /></label>
      </div>
      <div className="row3">
        <label><span className="field-label">camera</span><input className="input" value={l.camera} onChange={(e) => set("camera", e.target.value)} /></label>
        <label><span className="field-label">film stock</span><input className="input" list="stocks" value={l.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Kodak Portra 400" /></label>
        <label><span className="field-label">shot at ISO</span><input className="input" inputMode="numeric" value={l.iso} onChange={(e) => set("iso", Number(e.target.value) || 0)} /></label>
      </div>
      <datalist id="stocks">{["Kodak Portra 400", "Kodak Portra 160", "Kodak Gold 200", "Kodak Ultramax 400", "Kodak Ektar 100", "Kodak Tri-X 400", "Ilford HP5 Plus 400", "Ilford FP4 Plus 125", "Ilford XP2 Super 400", "CineStill 800T", "Kodak Ektachrome E100"].map((s) => <option key={s} value={s} />)}</datalist>
      <label><span className="field-label">field assignment</span>
        <select className="input" value={l.assignment ?? ""} onChange={(e) => set("assignment", e.target.value || undefined)}>
          <option value="">none, just shooting</option>
          {assignments.map((x) => <option key={x.id} value={x.id}>{x.title} ({x.node})</option>)}
        </select>
      </label>
      {a && <p className="muted" style={{ fontSize: "var(--t-s)" }}>{a.brief}</p>}
      <label><span className="field-label">light and conditions</span><input className="input" value={l.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="overcast morning, then open shade" /></label>

      <fieldset className="frames-fs">
        <legend className="field-label">frames worth noting</legend>
        {l.frames.map((f, i) => (
          <div key={i} className="frame-row">
            <span className="muted">#{f.n}</span>
            <input className="input" placeholder="f/8" value={f.aperture ?? ""} onChange={(e) => set("frames", l.frames.map((x, j) => j === i ? { ...x, aperture: e.target.value } : x))} />
            <input className="input" placeholder="1/125" value={f.shutter ?? ""} onChange={(e) => set("frames", l.frames.map((x, j) => j === i ? { ...x, shutter: e.target.value } : x))} />
            <input className="input wide" placeholder="what, and why" value={f.note ?? ""} onChange={(e) => set("frames", l.frames.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} />
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => set("frames", [...l.frames, { n: (l.frames.at(-1)?.n ?? 0) + 1 }])}>add a frame</button>
      </fieldset>

      <fieldset className="checks-fs">
        <legend className="field-label">self-review</legend>
        {checks.map((c) => (
          <label key={c} className="check">
            <input type="checkbox" checked={!!l.checklist[c]} onChange={(e) => set("checklist", { ...l.checklist, [c]: e.target.checked })} />
            <span>{c}</span>
          </label>
        ))}
      </fieldset>

      <label><span className="field-label">what worked, what didn&apos;t, what you&apos;d change</span><textarea className="input" value={l.reflection} onChange={(e) => set("reflection", e.target.value)} /></label>

      <div>
        <span className="field-label">links to scans (drive, flickr, a lab&apos;s gallery)</span>
        {l.links.map((u) => (
          <div key={u} className="linkrow"><a href={u} target="_blank" rel="noreferrer">{u.replace(/^https?:\/\//, "").slice(0, 48)}</a><button type="button" className="chip" onClick={() => set("links", l.links.filter((x) => x !== u))}>remove</button></div>
        ))}
        <div className="linkadd">
          <input className="input" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
          <button type="button" className="btn ghost" disabled={!/^https?:\/\/\S+$/.test(link)} onClick={() => { set("links", [...l.links, link]); setLink(""); }}>add link</button>
        </div>
      </div>

      <div className="formfoot">
        {onRemove && <button type="button" className="btn ghost" onClick={onRemove}>remove</button>}
        <button className="btn signal" disabled={!l.stock.trim()}>save roll</button>
      </div>
    </form>
  );
}
