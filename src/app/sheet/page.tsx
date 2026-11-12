"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Sheet from "@/components/Sheet";
import Float from "@/components/Float";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { statuses, missingFor, type Status } from "@/engine/graph";
import type { SkillNode } from "@/engine/types";

const WORD: Record<Status, string> = { locked: "unexposed", latent: "latent", learned: "developed", mastered: "keeper" };

export default function ContactSheet() {
  const { p } = useStore();
  const st = useMemo(() => statuses(pack, p), [p]);
  const [open, setOpen] = useState<SkillNode | null>(null);
  const byId = useMemo(() => new Map(pack.nodes.map((n) => [n.id, n])), []);
  const total = pack.nodes.length, dev = Object.values(st).filter((s) => s === "learned" || s === "mastered").length;

  return (
    <div className="page">
      <header className="pagehead">
        <div>
          <h1 className="display lift">the contact sheet</h1>
          <p className="lift">every skill is a frame. Latent ones glow and are ready to develop. Developed frames are prints, and keepers get the grease-pencil circle (you still remember them three weeks on).</p>
        </div>
        <span className="chip">{dev}/{total}</span>
      </header>

      <div className="strips">
        {pack.branches.map((b, bi) => {
          const nodes = pack.nodes.filter((n) => n.branch === b.id).sort((x, y) => x.tier - y.tier);
          return (
            <Float key={b.id} speed={0.03 + (bi % 3) * 0.02} tilt={bi % 2 ? 0.25 : -0.25} className="strip-wrap">
              <div className="strip-label lift"><h2 className="display">{b.title}</h2><span className="muted">{b.blurb}</span></div>
              <div className="strip filmbase">
                <div className="rebate"><span>film tutor 400</span><span>{bi + 1}a</span></div>
                <div className="strip-frames">
                  {nodes.map((n, k) => (
                    <motion.button key={n.id} className={`frame ${st[n.id]}`} onClick={() => setOpen(n)}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: k * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.98 }} aria-label={`${n.title}, ${WORD[st[n.id]]}`}>
                      <span className="frame-num">{k + 1}</span>
                      <span className="frame-img">
                        <span className="frame-title">{n.title}</span>
                      </span>
                      {st[n.id] === "mastered" && <svg className="grease" viewBox="0 0 100 70" aria-hidden><path d="M12 38C10 14 48 4 78 12c20 6 18 34-6 46-26 12-60 6-62-18 0-6 4-12 10-15" fill="none" stroke="#e8423a" strokeWidth="3.2" strokeLinecap="round" /></svg>}
                    </motion.button>
                  ))}
                </div>
                <div className="rebate bottom"><span>{nodes.length} frames</span></div>
              </div>
            </Float>
          );
        })}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} label={open?.title ?? "frame"}>
        {open && <FrameSheet n={open} status={st[open.id]} byId={byId} onPick={(x) => setOpen(x)} />}
      </Sheet>
    </div>
  );
}

function FrameSheet({ n, status, byId, onPick }: { n: SkillNode; status: Status; byId: Map<string, SkillNode>; onPick: (n: SkillNode) => void }) {
  const { p } = useStore();
  const m = missingFor(n, p);
  const branch = pack.branches.find((b) => b.id === n.branch)!;
  return (
    <div className="fsheet">
      <span className={`chip${status === "latent" ? " live" : ""}`}>{WORD[status]}</span>
      <h2 className="display" style={{ fontSize: "var(--t-xl)", margin: "12px 0 4px" }}>{n.title}</h2>
      <p style={{ margin: 0, color: "var(--ink-2)" }}>{n.blurb}</p>
      <p className="muted" style={{ fontSize: "var(--t-s)" }}>{branch.title}, about {n.minutes} minutes, +{n.xp} {pack.unit[1]}, {n.quiz.length} proof questions, {n.cards.length} cards{n.assignment ? ", one field assignment" : ""}.</p>
      {status === "locked" && (
        <div className="needs">
          <p>develops after:</p>
          <ul>
            {m.prereqs.map((id) => <li key={id}><button className="chip" onClick={() => onPick(byId.get(id)!)}>{byId.get(id)!.title}</button></li>)}
            {m.level && <li className="chip">reaching roll {m.level}</li>}
            {m.logs && <li className="chip">{m.logs} more logged {m.logs === 1 ? "roll" : "rolls"}</li>}
            {m.critiques && <li className="chip">{m.critiques} written {m.critiques === 1 ? "critique" : "critiques"}</li>}
          </ul>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        {status !== "locked" ? (
          <Link className={`btn ${status === "latent" ? "signal" : "ink"}`} href={`/frame/${n.id}/`}>{status === "latent" ? "study this frame" : "reread the lesson"}</Link>
        ) : (
          <Link className="btn ghost" href={`/frame/${n.id}/`}>preview</Link>
        )}
      </div>
    </div>
  );
}
