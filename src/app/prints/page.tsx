"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Float from "@/components/Float";
import Develop from "@/components/widgets/Develop";
import { useStore } from "@/lib/store";
import { FAMILIES, family, prepare, store, usePhotoSrc } from "@/lib/photos";
import { uid } from "@/lib/hooks";
import type { PhotoRec } from "@/engine/types";

type View = "wall" | "rolls" | "spectrum";
type Sort = "new" | "old" | "rating" | "hue";
type Filter = { q: string; tone: "all" | "colour" | "bw"; fam: string | null; fav: boolean; stars: number; stock: string; camera: string; roll: string; tag: string; year: string };
const NO_FILTER: Filter = { q: "", tone: "all", fam: null, fav: false, stars: 0, stock: "", camera: "", roll: "", tag: "", year: "" };

function Thumb({ rec, onOpen, big }: { rec: PhotoRec; onOpen: () => void; big?: boolean }) {
  const src = usePhotoSrc(rec, big ? "img" : "thumb");
  return (
    <button className="print-tile" onClick={onOpen} style={{ aspectRatio: `${rec.w} / ${rec.h}` }} aria-label={rec.title || `photo from ${rec.date}`}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="print-wait">{rec.shard ? "arriving…" : "on another device"}</span>}
      {(rec.fav || rec.rating > 0) && <span className="print-badge">{rec.fav ? "♥ " : ""}{rec.rating > 0 ? "★".repeat(rec.rating) : ""}</span>}
    </button>
  );
}

export default function Prints() {
  const { p, update } = useStore();
  const all = useMemo(() => Object.values(p.photos).filter((x) => !x.deleted), [p.photos]);
  const logs = useMemo(() => Object.values(p.logs).filter((l) => !l.deleted).sort((a, b) => b.date.localeCompare(a.date)), [p.logs]);
  const [f, setF] = useState<Filter>(NO_FILTER);
  const [view, setView] = useState<View>("wall");
  const [sort, setSort] = useState<Sort>("new");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const opts = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
    return { stock: uniq(all.map((x) => x.stock)), camera: uniq(all.map((x) => x.camera)), tag: uniq(all.flatMap((x) => x.tags)), year: uniq(all.map((x) => x.date.slice(0, 4))).reverse() };
  }, [all]);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const xs = all.filter((x) =>
      (!q || [x.title, x.place, x.notes, x.stock, x.camera, ...x.tags].join(" ").toLowerCase().includes(q)) &&
      (f.tone === "all" || (f.tone === "bw") === x.mono) &&
      (!f.fam || family(x.hue) === f.fam) && (!f.fav || x.fav) && x.rating >= f.stars &&
      (!f.stock || x.stock === f.stock) && (!f.camera || x.camera === f.camera) && (!f.roll || x.roll === f.roll) &&
      (!f.tag || x.tags.includes(f.tag)) && (!f.year || x.date.startsWith(f.year)));
    const by: Record<Sort, (a: PhotoRec, b: PhotoRec) => number> = {
      new: (a, b) => b.date.localeCompare(a.date) || b.addedAt - a.addedAt,
      old: (a, b) => a.date.localeCompare(b.date) || a.addedAt - b.addedAt,
      rating: (a, b) => b.rating - a.rating || +b.fav - +a.fav,
      hue: (a, b) => (a.hue ?? 999) - (b.hue ?? 999) || b.sat - a.sat,
    };
    return xs.sort(by[view === "spectrum" ? "hue" : sort]);
  }, [all, f, sort, view]);

  const active = JSON.stringify(f) !== JSON.stringify(NO_FILTER);
  const set = <K extends keyof Filter>(k: K, v: Filter[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useCallback((r: PhotoRec) => update((cur) => ({ ...cur, photos: { ...cur.photos, [r.id]: { ...r, updatedAt: Date.now() } }, updatedAt: Date.now() })), [update]);
  const rolls = useMemo(() => {
    const g = new Map<string, PhotoRec[]>();
    for (const x of shown) { const k = x.roll ?? `none`; g.set(k, [...(g.get(k) ?? []), x]); }
    return [...g];
  }, [shown]);

  return (
    <div className="page prints">
      <header className="pagehead">
        <div>
          <h1 className="display lift">prints</h1>
          <p className="lift">your own frames on the wall. Filter by stock, roll, colour or rating. Photos stay on your devices{` `}and sync, encrypted if you like, through your own GitHub.</p>
        </div>
        <button className="btn signal" onClick={() => setAdding(true)} data-magnet>add photos</button>
      </header>

      {all.length > 0 && (
        <Float speed={0.02} className="glass prints-filters">
          <div className="pf-row">
            <input className="input pf-search" placeholder="search titles, places, tags…" value={f.q} onChange={(e) => set("q", e.target.value)} aria-label="search photos" />
            <div className="seg" role="radiogroup" aria-label="layout">
              {(["wall", "rolls", "spectrum"] as View[]).map((v) => <button key={v} role="radio" aria-checked={view === v} className={`chip${view === v ? " live" : ""}`} onClick={() => setView(v)}>{v}</button>)}
            </div>
          </div>
          <div className="pf-row">
            {(["all", "colour", "bw"] as const).map((t) => <button key={t} className={`chip${f.tone === t ? " live" : ""}`} onClick={() => set("tone", t)} aria-pressed={f.tone === t}>{t === "bw" ? "b&w" : t}</button>)}
            <span className="pf-swatches" aria-label="colour family">
              {FAMILIES.map((x) => <button key={x.id} className={`pf-swatch${f.fam === x.id ? " on" : ""}`} style={{ background: x.c }} onClick={() => set("fam", f.fam === x.id ? null : x.id)} aria-pressed={f.fam === x.id} title={x.id}><span className="sr">{x.id}</span></button>)}
            </span>
            <button className={`chip${f.fav ? " live" : ""}`} onClick={() => set("fav", !f.fav)} aria-pressed={f.fav}>♥ favourites</button>
            <span className="pf-stars" aria-label="minimum rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= f.stars ? "on" : ""} onClick={() => set("stars", f.stars === n ? 0 : n)} aria-label={`${n} stars or more`}>★</button>)}</span>
          </div>
          <div className="pf-row">
            <select className="input" value={f.stock} onChange={(e) => set("stock", e.target.value)} aria-label="film stock"><option value="">any stock</option>{opts.stock.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="input" value={f.camera} onChange={(e) => set("camera", e.target.value)} aria-label="camera"><option value="">any camera</option>{opts.camera.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="input" value={f.roll} onChange={(e) => set("roll", e.target.value)} aria-label="roll"><option value="">any roll</option>{logs.map((l) => <option key={l.id} value={l.id}>{l.date} {l.title || l.stock}</option>)}</select>
            <select className="input" value={f.tag} onChange={(e) => set("tag", e.target.value)} aria-label="tag"><option value="">any tag</option>{opts.tag.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="input" value={f.year} onChange={(e) => set("year", e.target.value)} aria-label="year"><option value="">any year</option>{opts.year.map((x) => <option key={x}>{x}</option>)}</select>
            {view !== "spectrum" && <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="sort"><option value="new">newest</option><option value="old">oldest</option><option value="rating">top rated</option><option value="hue">by colour</option></select>}
            {active && <button className="btn ghost" onClick={() => setF(NO_FILTER)}>clear</button>}
          </div>
          <p className="muted pf-count">{shown.length} of {all.length} {all.length === 1 ? "print" : "prints"}</p>
        </Float>
      )}

      {all.length === 0 && (
        <Float speed={0.03} className="paper benchcard">
          <h2 className="display">an empty wall</h2>
          <p>Add scans from your phone or computer. Choose the roll they came from and the stock, camera and date fill themselves in. Colour or black & white and each photo's dominant colour are detected for you.</p>
          <button className="btn ink" onClick={() => setAdding(true)}>add your first photos</button>
        </Float>
      )}

      {view === "wall" && <div className="wall">{shown.map((x) => <Thumb key={x.id} rec={x} onOpen={() => setOpen(x.id)} />)}</div>}
      {view === "spectrum" && <div className="spectrum">{shown.map((x) => <Thumb key={x.id} rec={x} onOpen={() => setOpen(x.id)} />)}</div>}
      {view === "rolls" && rolls.map(([k, xs]) => {
        const l = p.logs[k];
        return (
          <section key={k} className="roll-strip filmbase">
            <div className="rebate"><span>{l ? `${l.date} · ${l.title || l.stock}` : "no roll"}</span><span>{l ? `${l.stock} ${l.iso}` : ""} · {xs.length}</span></div>
            <div className="roll-frames">{xs.map((x) => <Thumb key={x.id} rec={x} onOpen={() => setOpen(x.id)} />)}</div>
          </section>
        );
      })}

      <AnimatePresence>
        {open && p.photos[open] && <Lightbox key="lb" list={shown} id={open} onMove={setOpen} onClose={() => setOpen(null)} onSave={save} logs={logs} />}
        {adding && <AddSheet key="add" logs={logs} onClose={() => setAdding(false)} onAdd={(recs) => update((cur) => ({ ...cur, photos: { ...cur.photos, ...Object.fromEntries(recs.map((r) => [r.id, r])) }, updatedAt: Date.now() }))} />}
      </AnimatePresence>
    </div>
  );
}

function AddSheet({ logs, onClose, onAdd }: { logs: { id: string; date: string; title: string; stock: string; camera: string }[]; onClose: () => void; onAdd: (r: PhotoRec[]) => void }) {
  const [roll, setRoll] = useState("");
  const [stock, setStock] = useState(""), [camera, setCamera] = useState("Pentax K1000"), [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [tags, setTags] = useState(""), [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { const l = logs.find((x) => x.id === roll); if (l) { setStock(l.stock); setCamera(l.camera); setDate(l.date); } }, [roll, logs]);
  const base = (): Omit<PhotoRec, "id" | "w" | "h" | "mono" | "hue" | "sat"> => ({
    title: "", date, stock, camera, roll: roll || undefined, tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean), rating: 0, fav: false, addedAt: Date.now(), updatedAt: Date.now(),
  });
  const addFiles = async (fs: FileList) => {
    const out: PhotoRec[] = [];
    for (let i = 0; i < fs.length; i++) {
      setBusy(`developing ${i + 1} of ${fs.length}…`);
      try {
        const id = uid(), pr = await prepare(fs[i]);
        await store.save(id, pr.display, pr.thumb);
        out.push({ ...base(), id, title: fs[i].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), w: pr.w, h: pr.h, mono: pr.mono, hue: pr.hue, sat: pr.sat });
      } catch { /* skip files that aren't images */ }
    }
    onAdd(out); setBusy(null); onClose();
  };
  const addLink = () => {
    const u = link.trim();
    if (!/^https:\/\//.test(u)) return alert("Use an https:// link to an image.");
    const img = new Image();
    img.onload = () => { onAdd([{ ...base(), id: uid(), url: u, w: img.naturalWidth, h: img.naturalHeight, mono: false, hue: null, sat: 0 }]); onClose(); };
    img.onerror = () => alert("That link didn't load as an image.");
    img.src = u;
  };
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet-modal paper" role="dialog" aria-label="add photos" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="display">add to the wall</h2>
        <div className="formgrid">
          <label>from roll<select className="input" value={roll} onChange={(e) => setRoll(e.target.value)}><option value="">none</option>{logs.map((l) => <option key={l.id} value={l.id}>{l.date} {l.title || l.stock}</option>)}</select></label>
          <label>film stock<input className="input" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Portra 400" /></label>
          <label>camera<input className="input" value={camera} onChange={(e) => setCamera(e.target.value)} /></label>
          <label>date taken<input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label style={{ gridColumn: "1 / -1" }}>tags, comma separated<input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tompkins, skate, night" /></label>
        </div>
        <div className="formfoot" style={{ justifyContent: "flex-start" }}>
          <button className="btn signal" onClick={() => file.current?.click()} disabled={!!busy}>{busy ?? "choose photos"}</button>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files?.length && addFiles(e.target.files)} />
          <button className="btn ghost" onClick={onClose}>cancel</button>
        </div>
        <form className="linkadd" onSubmit={(e) => { e.preventDefault(); addLink(); }}>
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="or paste an https:// link to a hosted image" aria-label="image link" />
          <button className="btn ink" disabled={!link.trim()}>add link</button>
        </form>
        <p className="muted">Photos are resized to 1400 px on the long edge for the wall. Your originals stay where they are.</p>
      </motion.div>
    </motion.div>
  );
}

function Lightbox({ list, id, onMove, onClose, onSave, logs }: { list: PhotoRec[]; id: string; onMove: (id: string) => void; onClose: () => void; onSave: (r: PhotoRec) => void; logs: { id: string; date: string; title: string; stock: string }[] }) {
  const { p, update } = useStore();
  const rec = p.photos[id];
  const src = usePhotoSrc(rec, "img");
  const i = list.findIndex((x) => x.id === id);
  const go = useCallback((d: number) => { if (list.length) onMove(list[(i + d + list.length) % list.length].id); }, [i, list, onMove]);
  const [study, setStudy] = useState<Blob | null>(null);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); else if (e.key === "Escape") onClose();
      else if (/^[0-5]$/.test(e.key)) onSave({ ...rec, rating: +e.key });
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [go, onClose, onSave, rec]);
  useEffect(() => setStudy(null), [id]);
  if (!rec) return null;
  const field = (k: "title" | "place" | "stock" | "camera" | "notes" | "date", label: string, type = "text") => (
    <label>{label}<input className="input" type={type} value={rec[k] ?? ""} onChange={(e) => onSave({ ...rec, [k]: e.target.value })} /></label>
  );
  const remove = () => {
    if (!confirm("Take this photo off the wall? It's removed from every synced device.")) return;
    update((cur) => ({ ...cur, photos: { ...cur.photos, [id]: { ...rec, deleted: true, updatedAt: Date.now() } } }));
    store.drop(id); onClose();
  };
  return (
    <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="photo">
      <div className="lb-stage" onClick={onClose} onTouchStart={(e) => (touch.current = e.touches[0].clientX)} onTouchEnd={(e) => { if (touch.current !== null) { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touch.current = null; } }}>
        <AnimatePresence mode="popLayout">
          {src && <motion.img key={id} src={src} alt={rec.title} initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} onClick={(e) => e.stopPropagation()} />}
        </AnimatePresence>
        <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="previous">‹</button>
        <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="next">›</button>
        <button className="lb-close" onClick={onClose} aria-label="close">×</button>
      </div>
      <aside className="lb-side paper">
        <div className="lb-rate">
          <button className={`lb-fav${rec.fav ? " on" : ""}`} onClick={() => onSave({ ...rec, fav: !rec.fav })} aria-pressed={rec.fav} aria-label="favourite">♥</button>
          {[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= rec.rating ? "on" : ""} onClick={() => onSave({ ...rec, rating: rec.rating === n ? 0 : n })} aria-label={`${n} stars`}>★</button>)}
          <span className="muted">{i + 1} / {list.length}</span>
        </div>
        <div className="formgrid">
          {field("title", "title")}
          {field("date", "date taken", "date")}
          {field("stock", "film stock")}
          {field("camera", "camera")}
          {field("place", "place")}
          <label>roll<select className="input" value={rec.roll ?? ""} onChange={(e) => onSave({ ...rec, roll: e.target.value || undefined })}><option value="">none</option>{logs.map((l) => <option key={l.id} value={l.id}>{l.date} {l.title || l.stock}</option>)}</select></label>
          <label style={{ gridColumn: "1 / -1" }}>tags<input className="input" value={rec.tags.join(", ")} onChange={(e) => onSave({ ...rec, tags: e.target.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) })} /></label>
          <label style={{ gridColumn: "1 / -1" }}>notes<textarea className="input" rows={2} value={rec.notes ?? ""} onChange={(e) => onSave({ ...rec, notes: e.target.value })} /></label>
        </div>
        <p className="muted lb-facts">{rec.mono ? "black & white" : `colour${rec.hue !== null ? `, mostly ${family(rec.hue)}` : ""}`} · {rec.w}×{rec.h}{rec.shard ? " · synced" : rec.url ? " · linked" : ""}</p>
        <div className="formfoot" style={{ justifyContent: "flex-start" }}>
          {!rec.url && <button className="btn ink" onClick={async () => setStudy(study ? null : (await store.get(id, "img")) ?? null)}>{study ? "close the edit study" : "try edits on it"}</button>}
          <button className="btn ghost" onClick={remove}>remove</button>
        </div>
        {study && <Develop image={study} panels={["basic", "wb", "curve", "hsl", "grade", "bw"]} />}
      </aside>
    </motion.div>
  );
}
