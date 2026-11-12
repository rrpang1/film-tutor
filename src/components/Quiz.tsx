"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizItem } from "@/engine/types";
import { PASS } from "@/engine/graph";

type Ans = { correct: boolean };

/** The proof: one question at a time, always explaining why, scored at the end. */
export default function Quiz({ items, onDone }: { items: QuizItem[]; onDone: (score: number, pass: boolean) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Ans[]>([]);
  const [picked, setPicked] = useState<number | boolean | null>(null);
  const [numVal, setNumVal] = useState("");
  const q = items[i];
  const done = answers.length === items.length;
  const score = answers.filter((a) => a.correct).length / items.length;

  const answer = (v: number | boolean) => {
    if (picked !== null) return;
    let correct = false;
    if (q.kind === "choice") correct = v === q.answer;
    if (q.kind === "truefalse") correct = v === q.answer;
    if (q.kind === "number") correct = Math.abs((v as number) - q.answer) <= (q.tolerance ?? 0.001);
    setPicked(v);
    setAnswers((a) => [...a, { correct }]);
  };
  const next = () => {
    setPicked(null); setNumVal("");
    if (i + 1 < items.length) setI(i + 1);
  };
  const correctNow = picked !== null && answers[answers.length - 1]?.correct;

  if (done && picked === null) {
    const pass = score >= PASS;
    return (
      <div className="quiz-end">
        <p className="display" style={{ fontSize: "var(--t-xl)", margin: 0 }}>{Math.round(score * 100)}%</p>
        <p>{pass ? "the proof holds. Time to develop it." : `you need ${Math.round(PASS * 100)}% to develop this frame. Re-read the parts you missed and try again.`}</p>
        <button className={`btn ${pass ? "signal" : "ink"}`} onClick={() => onDone(score, pass)} autoFocus>
          {pass ? "develop this frame" : "try the proof again"}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-pips" aria-hidden>{items.map((_, k) => <i key={k} className={k < answers.length ? (answers[k].correct ? "ok" : "no") : k === i ? "now" : ""} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 24, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -24, filter: "blur(4px)" }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <p className="quiz-q">{q.q}</p>
          {q.kind === "choice" && (
            <div className="quiz-opts">
              {q.options.map((o, k) => (
                <button key={k} className={`quiz-opt${picked !== null ? (k === q.answer ? " right" : k === picked ? " wrong" : " dim") : ""}`} onClick={() => answer(k)} disabled={picked !== null}>{o}</button>
              ))}
            </div>
          )}
          {q.kind === "truefalse" && (
            <div className="quiz-opts two">
              {[true, false].map((v) => (
                <button key={String(v)} className={`quiz-opt${picked !== null ? (v === q.answer ? " right" : v === picked ? " wrong" : " dim") : ""}`} onClick={() => answer(v)} disabled={picked !== null}>{v ? "true" : "false"}</button>
              ))}
            </div>
          )}
          {q.kind === "number" && (
            <form className="quiz-num" onSubmit={(e) => { e.preventDefault(); if (numVal.trim()) answer(Number(numVal)); }}>
              <input className="input" inputMode="decimal" value={numVal} onChange={(e) => setNumVal(e.target.value)} disabled={picked !== null} aria-label="your answer" autoFocus />
              {q.unit && <span className="muted">{q.unit}</span>}
              <button className="btn ink" disabled={picked !== null || !numVal.trim()}>answer</button>
            </form>
          )}
          {picked !== null && (
            <motion.div className={`quiz-why ${correctNow ? "ok" : "no"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <b>{correctNow ? "right." : q.kind === "number" ? `the answer is ${q.answer}.` : "not quite."}</b> {q.why}
              <div><button className="btn ink" onClick={next} autoFocus>{i + 1 < items.length ? "next question" : "see your score"}</button></div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
