"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Float from "@/components/Float";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { award, enroll } from "@/engine/progress";
import type { CritiqueRec, CritiqueSubject } from "@/engine/types";
import { uid } from "@/lib/hooks";

const STEPS = [
  { k: "describe", title: "describe", ask: "What is literally there? People, objects, place, light, format. No judgements yet." },
  { k: "analyze", title: "analyze", ask: "How is it built? Composition, tone, light, focus, vantage. Where does your eye go first, and why?" },
  { k: "interpret", title: "interpret", ask: "What is it about? Make a claim, and support it with 'because'. Use the context." },
  { k: "judge", title: "judge", ask: "Is it successful? By which criteria: formal, expressive, original, ethical? Name your punctum if there is one." },
] as const;
type K = (typeof STEPS)[number]["k"];
const searchUrl = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

export default function Loupe() {
  const { p, update } = useStore();
  const [sub, setSub] = useState<CritiqueSubject | null>(null);
  const avail = (s: CritiqueSubject) => !s.unlockedBy || !!p.nodes[s.unlockedBy]?.learnedAt;
  const past = useMemo(() => Object.values(p.critiques).filter((c) => !c.deleted).sort((a, b) => b.at - a.at), [p.critiques]);
  const glossaryOn = pack.glossary.every((c) => p.cards[c.id]);
  const critiqueStarted = pack.nodes.some((n) => n.branch === "critique" && p.nodes[n.id]?.learnedAt);

  if (sub) return <Reading s={sub} onClose={() => setSub(null)} />;

  return (
    <div className="page">
      <header className="pagehead">
        <div>
          <h1 className="display lift">the loupe</h1>
          <p className="lift">learn to speak photography by writing about it. Choose a photograph, look at it properly, write your reading in four steps, then compare it with a model reading.</p>
        </div>
        <span className="chip">{past.length} written</span>
      </header>

      <Float speed={0.03} className="vocab brushed">
        <div>
          <h2 className="display">the vocabulary deck</h2>
          <p className="muted">{pack.glossary.length} words critics use: acutance, punctum, vernacular, frontality… They go into the darkroom like any other cards.</p>
        </div>
        {glossaryOn ? <span className="chip live">in the darkroom</span> : (
          <button className="btn ink" disabled={!critiqueStarted} onClick={() => update((cur) => enroll(cur, pack.glossary.map((c) => c.id), Date.now()))}>
            {critiqueStarted ? "add the deck" : "develop “describe what you see” first"}
          </button>
        )}
      </Float>

      <div className="subjects">
        {pack.critiques.map((s, k) => {
          const ok = avail(s);
          const done = past.some((c) => c.subject === s.id);
          return (
            <motion.button key={s.id} className={`subject paper${ok ? "" : " unexposed"}`} disabled={!ok} onClick={() => setSub(s)}
              style={{ rotate: ((k * 29) % 5) - 2 }} whileHover={ok ? { y: -5, rotate: 0 } : undefined}>
              <span className="loupe-ring" aria-hidden />
              <b>{ok ? s.title : "unexposed"}</b>
              <span className="muted">{ok ? `${s.by}, ${s.year}` : `after “${pack.nodes.find((n) => n.id === s.unlockedBy)?.title}”`}</span>
              {done && <span className="chip live">written</span>}
            </motion.button>
          );
        })}
      </div>

      {past.length > 0 && (
        <section className="past">
          <h2 className="display lift">your readings</h2>
          {past.map((c) => {
            const s = pack.critiques.find((x) => x.id === c.subject);
            return (
              <details key={c.id} className="paper pastc">
                <summary><b>{s?.title}</b> <span className="muted">{new Date(c.at).toLocaleDateString()}</span></summary>
                {STEPS.map((st) => <p key={st.k}><b>{st.title}.</b> {c.answers[st.k]}</p>)}
              </details>
            );
          })}
        </section>
      )}
    </div>
  );
}

function Reading({ s, onClose }: { s: CritiqueSubject; onClose: () => void }) {
  const { update } = useStore();
  const [ans, setAns] = useState<Record<K, string>>({ describe: "", analyze: "", interpret: "", judge: "" });
  const [step, setStep] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState<Record<string, number>>({});
  const cur = STEPS[step];
  const words = ans[cur.k].trim().split(/\s+/).filter(Boolean).length;

  const save = () => {
    const now = Date.now();
    const rec: CritiqueRec = { id: uid(), subject: s.id, answers: ans, score, at: now, updatedAt: now };
    update((p) => award({ ...p, critiques: { ...p.critiques, [rec.id]: rec }, updatedAt: now }, `crit:${rec.id}`, 8, `read ${s.title}`, now));
    onClose();
  };

  return (
    <div className="page reading">
      <button className="back lift" onClick={onClose}>all photographs</button>
      <header className="paper reading-head">
        <span className="muted">{s.by}, {s.year}</span>
        <h1 className="display">{s.title}</h1>
        <p>{s.context}</p>
        <a className="btn ink" href={searchUrl(s.search)} target="_blank" rel="noreferrer">open the photograph</a>
        <p className="muted" style={{ fontSize: "var(--t-s)", marginTop: 10 }}>Look at it for a full minute before you write anything.</p>
      </header>

      {!reveal ? (
        <section className="glass steps">
          <div className="step-tabs">{STEPS.map((x, i) => <button key={x.k} className={`chip${i === step ? " live" : ""}`} onClick={() => setStep(i)}>{x.title}{ans[x.k].trim() ? " ✓" : ""}</button>)}</div>
          <AnimatePresence mode="wait">
            <motion.div key={cur.k} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="display">{cur.title}</h2>
              <p className="muted">{cur.ask}</p>
              <textarea className="input" style={{ minHeight: 180 }} value={ans[cur.k]} onChange={(e) => setAns({ ...ans, [cur.k]: e.target.value })} aria-label={cur.title} />
              <div className="formfoot">
                <span className="muted">{words} words</span>
                {step < 3 ? <button className="btn ink" onClick={() => setStep(step + 1)} disabled={words < 8}>next: {STEPS[step + 1].title}</button>
                  : <button className="btn signal" onClick={() => setReveal(true)} disabled={STEPS.some((x) => ans[x.k].trim().split(/\s+/).length < 8)}>compare with a model reading</button>}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      ) : (
        <section className="compare">
          {STEPS.map((x, i) => (
            <motion.div key={x.k} className="pair" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
              <div className="paper mine"><span className="muted">yours: {x.title}</span><p>{ans[x.k]}</p></div>
              <div className="paper model"><span className="muted">a model reading</span><p>{s.model[x.k]}</p>
                <div className="rate" role="radiogroup" aria-label={`rate your ${x.title}`}>
                  <span className="muted">compared with this, yours was</span>
                  {["thin", "close", "as strong"].map((lab, v) => (
                    <button key={lab} role="radio" aria-checked={score[x.k] === v} className={`chip${score[x.k] === v ? " live" : ""}`} onClick={() => setScore({ ...score, [x.k]: v })}>{lab}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          <div className="paper vocab-used">
            <span className="muted">vocabulary worth using here</span>
            <p>{s.vocabulary.map((v) => <span key={v} className="chip" style={{ margin: "0 6px 6px 0" }}>{v}</span>)}</p>
          </div>
          <div className="formfoot"><button className="btn signal" onClick={save}>save this reading (+8)</button></div>
        </section>
      )}
    </div>
  );
}
