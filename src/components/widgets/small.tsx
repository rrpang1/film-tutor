"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Dial from "./Dial";
import { APERTURES, SHUTTERS, ISOS, fLabel, shutterLabel } from "./expo";

/** Three ladders. Every rung is one stop, and the light bar doubles or halves. */
export function StopsLadder() {
  const [a, setA] = useState(5), [s, setS] = useState(6), [i, setI] = useState(1);
  const stops = (5 - a) + (6 - s) + (i - 1);
  const w = Math.max(4, Math.min(100, 25 * Math.pow(2, stops / 1.6)));
  return (
    <figure className="widget brushed">
      <figcaption className="widget-head"><span className="display">the stop ladder</span><span className="muted">move any rung one step and the light doubles or halves.</span></figcaption>
      <div className="sim-dials">
        <Dial label="aperture" values={APERTURES.map((_, k) => k)} value={a} onChange={setA} format={(k) => fLabel(APERTURES[k])} />
        <Dial label="shutter" values={SHUTTERS.map((_, k) => k)} value={s} onChange={setS} format={(k) => shutterLabel(SHUTTERS[k])} />
        <Dial label="film" values={ISOS.map((_, k) => k)} value={i} onChange={setI} format={(k) => `${ISOS[k]}`} />
      </div>
      <div className="ladder-bar" aria-label={`${stops} stops from the starting exposure`}>
        <motion.span animate={{ width: `${w}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
      </div>
      <p className="muted" style={{ margin: "8px 0 0" }}>
        {stops === 0 ? "the starting exposure: f/8, 1/60, ISO 200." : `${Math.abs(stops)} ${Math.abs(stops) === 1 ? "stop" : "stops"} ${stops > 0 ? "more" : "less"} light: ${Math.pow(2, Math.abs(stops))}× ${stops > 0 ? "as much" : "less"}.`}
      </p>
    </figure>
  );
}

const ZONES = [
  ["0", "pure black. Unexposed film base."], ["I", "near black, no texture."], ["II", "first hint of texture in deep shadow."],
  ["III", "dark shadow with full texture. Place your important shadows here."], ["IV", "dark foliage, shadowed skin, old wood."],
  ["V", "middle grey. What the meter aims for. A grey card, clear north sky."], ["VI", "average skin in sun, light stone."],
  ["VII", "very light skin, light grey concrete: the last tone with full texture."], ["VIII", "whites with a whisper of texture."],
  ["IX", "glaring white, no texture."], ["X", "paper white. Specular highlights, the sun."],
];
const PLACE = [
  { thing: "fresh snow in sun", zone: 7 }, { thing: "a grey card", zone: 5 }, { thing: "a dark coat you want detail in", zone: 3 }, { thing: "sunlit skin", zone: 6 },
];

/** Eleven zones, a stop apart. In full mode there's a quick game: put the thing on its zone. */
export function ZoneScale({ simple }: { simple?: boolean }) {
  const [sel, setSel] = useState(5);
  const [q, setQ] = useState(0);
  const [res, setRes] = useState<null | boolean>(null);
  const pick = (k: number) => {
    setSel(k);
    if (!simple) setRes(Math.abs(k - PLACE[q].zone) <= (PLACE[q].zone === 6 ? 1 : 0) ? true : false);
  };
  return (
    <figure className="widget brushed">
      <figcaption className="widget-head"><span className="display">{simple ? "the grey scale" : "the zone scale"}</span>
        <span className="muted">{simple ? "your meter wants everything to be zone v." : `where does ${PLACE[q].thing} belong?`}</span></figcaption>
      <div className="zones" role="radiogroup" aria-label="zones">
        {ZONES.map(([z], k) => (
          <button key={z} role="radio" aria-checked={k === sel} className={`zone${k === sel ? " on" : ""}`} style={{ background: `hsl(210 6% ${4 + k * 9.3}%)`, color: k > 5 ? "var(--ink)" : "var(--bone)" }} onClick={() => pick(k)}>{z}</button>
        ))}
      </div>
      <p style={{ margin: "10px 0 0" }}><b>zone {ZONES[sel][0]}</b>: {ZONES[sel][1]}</p>
      {!simple && res !== null && (
        <p className={res ? "good" : "bad"} style={{ margin: "6px 0 0" }}>
          {res ? "yes." : `not quite. ${PLACE[q].thing} sits around zone ${ZONES[PLACE[q].zone][0]}.`}{" "}
          <button className="btn ghost" style={{ minHeight: 32, marginLeft: 8 }} onClick={() => { setQ((q + 1) % PLACE.length); setRes(null); }}>next</button>
        </p>
      )}
    </figure>
  );
}

/** Depth of field on a 50mm: three people at 1, 3 and 10 metres; see who's sharp. */
export function DofWidget() {
  const [n, setN] = useState(2.8);
  const [s, setS] = useState(3);
  const f = 50, c = 0.03;
  const H = (f * f) / (n * c) + f; // mm
  const smm = s * 1000;
  const near = (smm * (H - f)) / (H + smm - 2 * f) / 1000;
  const far = smm < H ? (smm * (H - f)) / (H - smm) / 1000 : Infinity;
  const people = [1, 3, 10];
  const blur = (d: number) => {
    if (d >= near && d <= far) return 0;
    const off = d < near ? (near - d) / d : (d - far) / d;
    return Math.min(6, off * (12 / n) * 3);
  };
  const fmt = (m: number) => (m === Infinity ? "infinity" : m >= 10 ? `${m.toFixed(0)} m` : `${m.toFixed(1)} m`);
  return (
    <figure className="widget brushed">
      <figcaption className="widget-head"><span className="display">depth of field, 50mm</span><span className="muted">sharp from {fmt(near)} to {fmt(far)}.</span></figcaption>
      <div className="dof-stage">
        {people.map((d, k) => (
          <div key={d} className="dof-p" style={{ left: `${18 + k * 30}%`, transform: `scale(${1.25 - k * 0.32})`, filter: `blur(${blur(d)}px)` }}>
            <span className="dof-head" /><span className="dof-body" /><span className="dof-tag">{d} m</span>
          </div>
        ))}
      </div>
      <div className="sim-dials">
        <Dial label="aperture" values={APERTURES.slice(1)} value={n} onChange={setN} format={fLabel} />
        <Dial label="focus" values={[1, 1.5, 2, 3, 5, 10]} value={s} onChange={setS} format={(v) => `${v} m`} />
      </div>
    </figure>
  );
}

/** Drag the subject around a frame; the grid answers with what you've chosen. */
export function ThirdsWidget() {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const near = (v: number, t: number) => Math.abs(v - t) < 0.06;
  const onThird = (near(pos.x, 1 / 3) || near(pos.x, 2 / 3)) && (near(pos.y, 1 / 3) || near(pos.y, 2 / 3));
  const centred = near(pos.x, 0.5) && near(pos.y, 0.5);
  const edge = pos.x < 0.1 || pos.x > 0.9 || pos.y < 0.1 || pos.y > 0.9;
  const move = (e: React.PointerEvent) => {
    if (!(e.buttons & 1) && e.type === "pointermove") return;
    const b = box.current!.getBoundingClientRect();
    setPos({ x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) });
  };
  return (
    <figure className="widget brushed">
      <figcaption className="widget-head"><span className="display">placement</span><span className="muted">drag the figure. there's no wrong answer, only a choice.</span></figcaption>
      <div ref={box} className="thirds" onPointerDown={move} onPointerMove={move} style={{ touchAction: "none" }}>
        <i style={{ left: "33.33%" }} /><i style={{ left: "66.66%" }} /><b style={{ top: "33.33%" }} /><b style={{ top: "66.66%" }} />
        <span className="thirds-dot" style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }} />
      </div>
      <p className="muted" style={{ margin: "10px 0 0" }}>
        {onThird ? "on a third: movement and room around the subject." : centred ? "centred: stable, formal, confrontational." : edge ? "at the edge: tension. The figure might leave the frame." : "off-grid: fine, if it's on purpose."}
      </p>
    </figure>
  );
}
