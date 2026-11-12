"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { dueQueue, gradeCard, type QueueCard } from "@/engine/progress";
import { review, newCard, type Grade } from "@/engine/srs";
import { getSession, nextInSession } from "@/lib/session";

const GRADES: { g: Grade; label: string }[] = [
  { g: "again", label: "again" }, { g: "hard", label: "hard" }, { g: "good", label: "good" }, { g: "easy", label: "easy" },
];
const when = (days: number) => (days === 0 ? "10 min" : days === 1 ? "1 day" : days < 30 ? `${days} days` : `${Math.round(days / 30)} mo`);

/** Review under the safelight. A card's back develops in when you reveal it. */
export default function Darkroom() {
  const { p, update, ready } = useStore();
  // freeze the queue at the start of the sitting so graded cards leave it
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [fromSession, setFromSession] = useState(false);
  useEffect(() => { if (ready && queue === null) setQueue(dueQueue(pack, p, Date.now())); }, [ready, p, queue]);
  useEffect(() => { setFromSession(location.search.includes("session") && !!getSession()); }, []);
  const card = queue?.[i];

  const grade = (g: Grade) => {
    if (!card) return;
    update((cur) => gradeCard(cur, card.id, g, Date.now()));
    if (g === "again") setQueue((q) => [...q!, card]);
    setShown(false); setI((x) => x + 1); setDoneCount((d) => d + 1);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!card) return;
      if (!shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setShown(true); }
      else if (shown && ["1", "2", "3", "4"].includes(e.key)) grade(GRADES[+e.key - 1].g);
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  });
  const preview = useMemo(() => card ? GRADES.map(({ g }) => review(p.cards[card.id] ?? newCard(0), g, 0).interval) : [], [card, p.cards]);
  const nextFrame = fromSession ? nextInSession(null, (x) => !!p.nodes[x]?.learnedAt) : null;

  return (
    <div className="page darkroom">
      <div className="safelight" aria-hidden />
      <header className="pagehead">
        <div>
          <h1 className="display">the darkroom</h1>
          <p>cards from every frame you&apos;ve developed come back here just before you&apos;d forget them. Grade yourself honestly. That&apos;s what makes it work.</p>
        </div>
        {queue && <span className="chip">{Math.max(0, queue.length - i)} left</span>}
      </header>

      <div className="tray-stage">
        <AnimatePresence mode="wait">
          {card ? (
            <motion.div key={card.id + i} className="rcard paper" initial={{ opacity: 0, y: 40, rotate: 1.5, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, rotate: -0.4, filter: "blur(0px)" }} exit={{ opacity: 0, x: -60, rotate: -4, filter: "blur(4px)" }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
              <span className="muted rcard-src">{card.source}</span>
              <p className="rcard-front">{card.front}</p>
              {shown ? (
                <motion.p className="rcard-back" initial={{ opacity: 0, filter: "brightness(0.2) blur(6px)" }} animate={{ opacity: 1, filter: "brightness(1) blur(0px)" }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>{card.back}</motion.p>
              ) : (
                <button className="btn ink" onClick={() => setShown(true)} autoFocus>develop the answer</button>
              )}
              {shown && (
                <div className="grades">
                  {GRADES.map(({ g, label }, k) => (
                    <button key={g} className={`grade ${g}`} onClick={() => grade(g)}>
                      <span>{label}</span><span className="muted">{when(preview[k])}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : queue ? (
            <motion.div key="empty" className="empty paper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="display">{doneCount ? "the tray is empty." : "nothing in the tray."}</h2>
              <p>{doneCount ? `${doneCount} cards reviewed. They'll be back when they're due.` : "Develop a frame on the contact sheet and its cards will start arriving here."}</p>
              {nextFrame ? <Link className="btn signal" href={`/frame/${nextFrame}/`}>on to today&apos;s frames</Link> : <Link className="btn ink" href="/sheet/">to the contact sheet</Link>}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <p className="muted keys">space reveals; 1–4 grade.</p>
    </div>
  );
}
