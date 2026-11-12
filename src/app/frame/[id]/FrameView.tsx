"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Prose from "@/components/Prose";
import Quiz from "@/components/Quiz";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { statusOf, missingFor, wouldUnlock } from "@/engine/graph";
import { recordProof } from "@/engine/progress";
import { nextInSession } from "@/lib/session";

export default function FrameView({ id }: { id: string }) {
  const { p, update, celebrate, ready } = useStore();
  const n = pack.nodes.find((x) => x.id === id)!;
  const status = statusOf(n, p);
  const [proof, setProof] = useState(false);
  const [quizKey, setQuizKey] = useState(0);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const branch = pack.branches.find((b) => b.id === n.branch)!;
  const m = missingFor(n, p);
  const next = ready ? nextInSession(id, (x) => !!p.nodes[x]?.learnedAt) : null;
  const nextNode = next ? pack.nodes.find((x) => x.id === next) : null;

  const done = (score: number, pass: boolean) => {
    if (!pass) { update((cur) => recordProof(pack, cur, id, score, false, Date.now())); setQuizKey((k) => k + 1); return; }
    const now = Date.now();
    const first = !p.nodes[id]?.learnedAt;
    const unlocked = first ? wouldUnlock(pack, p, id, now) : [];
    update((cur) => recordProof(pack, cur, id, score, true, now));
    setProof(false);
    if (first) celebrate({ kind: "develop", node: n, unlocked, gained: n.xp });
  };

  if (status === "locked") {
    return (
      <div className="page frame-page">
        <Link href="/sheet/" className="back lift">contact sheet</Link>
        <div className="paper lesson locked-print">
          <p className="muted">{branch.title}</p>
          <h1 className="display">{n.title}</h1>
          <p>{n.blurb}</p>
          <div className="needs">
            <p>this frame is still unexposed. It develops after:</p>
            <ul>
              {m.prereqs.map((pid) => { const x = pack.nodes.find((y) => y.id === pid)!; return <li key={pid}><Link className="chip" href={`/frame/${pid}/`}>{x.title}</Link></li>; })}
              {m.level && <li className="chip">reaching roll {m.level}</li>}
              {m.logs && <li className="chip"><Link href="/log/?new=1">{m.logs} more logged {m.logs === 1 ? "roll" : "rolls"}</Link></li>}
              {m.critiques && <li className="chip"><Link href="/loupe/">{m.critiques} written {m.critiques === 1 ? "critique" : "critiques"}</Link></li>}
            </ul>
          </div>
          <div className="locked-veil" aria-hidden>{n.lesson.slice(0, 2).map((b, i) => <p key={i}>{"text" in b ? b.text.replace(/\*/g, "") : ""}</p>)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page frame-page">
      <motion.div className="readbar" style={{ scaleX: bar }} aria-hidden />
      <Link href="/sheet/" className="back lift">contact sheet</Link>
      <motion.article className="paper lesson" initial={{ opacity: 0, y: 30, rotate: -0.6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <header className="lesson-head">
          <span className="muted">{branch.title}, {n.minutes} min</span>
          <h1 className="display">{n.title}</h1>
          <p className="lesson-blurb">{n.blurb}</p>
          {status !== "latent" && <span className="chip">developed{p.nodes[id]?.best ? `, best proof ${Math.round(p.nodes[id].best! * 100)}%` : ""}</span>}
        </header>
        <Prose blocks={n.lesson} />
      </motion.article>

      {n.assignment && (
        <section className="assign brushed">
          <span className="muted">field assignment</span>
          <h2 className="display">{n.assignment.title}</h2>
          <p>{n.assignment.brief}</p>
          <ul className="checks">{n.assignment.checklist.map((c) => <li key={c}>{c}</li>)}</ul>
          <Link className="btn ink" href={`/log/?new=1&assignment=${n.assignment.id}`}>log this assignment</Link>
        </section>
      )}

      <section className="proof glass">
        {!proof ? (
          <div className="proof-start">
            <h2 className="display">{status === "latent" ? "the proof" : "proof again"}</h2>
            <p className="muted">{n.quiz.length} questions. {status === "latent" ? `80% develops the frame for +${n.xp} ${pack.unit[1]}.` : "Practice only; no frames for a retake."}</p>
            <button className={`btn ${status === "latent" ? "signal" : "ghost"}`} onClick={() => setProof(true)} data-magnet>start the proof</button>
          </div>
        ) : (
          <Quiz key={quizKey} items={n.quiz} onDone={done} />
        )}
      </section>

      {status !== "latent" && (
        <nav className="frame-next">
          {nextNode ? <Link className="btn signal" href={`/frame/${nextNode.id}/`}>next in today&apos;s roll: {nextNode.title}</Link> : <Link className="btn ink" href="/sheet/">back to the sheet</Link>}
        </nav>
      )}
    </div>
  );
}
