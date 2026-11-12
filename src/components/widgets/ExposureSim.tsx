"use client";
import { useState } from "react";
import Dial from "./Dial";
import Needle from "./Needle";
import { APERTURES, SHUTTERS, ISOS, fLabel, shutterLabel, errorStops } from "./expo";

const SCENES = [
  { id: "beach", name: "bright beach", ev: 15, sky: ["#cfe3f5", "#f3f6f8"], ground: "#e8dcc4" },
  { id: "street", name: "overcast street", ev: 12, sky: ["#c9cfd6", "#e2e5e8"], ground: "#8d939a" },
  { id: "shade", name: "open shade", ev: 11, sky: ["#b9c9d9", "#dde4ea"], ground: "#6f7d72" },
  { id: "window", name: "window-lit room", ev: 8, sky: ["#8c8577", "#c9c1b1"], ground: "#5c5245" },
  { id: "night", name: "lit shopfront at night", ev: 6, sky: ["#1d2533", "#3a4253"], ground: "#2b2a2a" },
];

/**
 * A K1000 in miniature. Pick a scene and turn the dials. The needle and a rendered frame
 * show brightness, depth of field (background blur), motion (the cyclist) and grain.
 */
export default function ExposureSim() {
  const [scene, setScene] = useState(SCENES[1]);
  const [n, setN] = useState(8);
  const [t, setT] = useState(1 / 125);
  const [iso, setIso] = useState(400);
  const err = errorStops(scene.ev, iso, n, t);
  const bright = Math.pow(2, Math.max(-3, Math.min(3, err)) * 0.4);
  const bgBlur = Math.max(0, (8 / n) * 1.6 - 0.6);
  const motion = Math.min(40, t * 1400);
  const grain = Math.min(0.55, 0.08 + Math.log2(iso / 100) * 0.08);
  const verdict = Math.abs(err) < 0.5 ? "correct exposure" : err > 0 ? `${Math.abs(err).toFixed(1)} stops over` : `${Math.abs(err).toFixed(1)} stops under`;

  return (
    <figure className="widget brushed sim">
      <figcaption className="widget-head">
        <span className="display">exposure simulator</span>
        <span className="muted">centre the needle. then change one dial and win the stop back with another.</span>
      </figcaption>
      <div className="sim-scenes" role="radiogroup" aria-label="scene">
        {SCENES.map((s) => (
          <button key={s.id} role="radio" aria-checked={s.id === scene.id} className={`chip${s.id === scene.id ? " live" : ""}`} onClick={() => setScene(s)}>{s.name}</button>
        ))}
      </div>
      <div className="sim-body">
        <div className="sim-view" aria-label={`rendered frame: ${verdict}`}>
          <svg viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" style={{ filter: `brightness(${bright}) contrast(${err < -1 ? 0.8 : 1})` }}>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scene.sky[0]} /><stop offset="1" stopColor={scene.sky[1]} /></linearGradient>
              <filter id="bg"><feGaussianBlur stdDeviation={bgBlur} /></filter>
              <filter id="mo"><feGaussianBlur stdDeviation={`${motion / 6} 0`} /></filter>
              <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed={Math.round(err * 10)} /><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0" /></filter>
            </defs>
            <rect width="360" height="240" fill="url(#sky)" />
            <g filter="url(#bg)">
              <rect x="0" y="70" width="70" height="110" fill="#000" opacity=".22" />
              <rect x="80" y="40" width="60" height="140" fill="#000" opacity=".16" />
              <rect x="250" y="60" width="110" height="120" fill="#000" opacity=".2" />
              {scene.id === "night" && [20, 95, 270, 310].map((x) => <rect key={x} x={x} y="110" width="22" height="18" fill="#ffd9a0" opacity=".9" />)}
            </g>
            <rect x="0" y="178" width="360" height="62" fill={scene.ground} />
            <g filter="url(#mo)">
              <circle cx="170" cy="202" r="15" fill="none" stroke="#1a1d21" strokeWidth="3" />
              <circle cx="222" cy="202" r="15" fill="none" stroke="#1a1d21" strokeWidth="3" />
              <path d="M170 202l18-26h22l12 26M188 176l-6-12M205 176l5-18" stroke="#1a1d21" strokeWidth="3" fill="none" />
              <circle cx="206" cy="140" r="8" fill="#1a1d21" />
              <path d="M206 148l-4 22 14 8" stroke="#1a1d21" strokeWidth="5" strokeLinecap="round" fill="none" />
            </g>
            <rect x="60" y="150" width="6" height="90" fill="#22262b" />
            <rect width="360" height="240" filter="url(#gr)" opacity={grain} style={{ mixBlendMode: "overlay" }} />
          </svg>
          <span className={`sim-verdict${Math.abs(err) < 0.5 ? " ok" : ""}`}>{verdict}</span>
        </div>
        <Needle error={err} />
      </div>
      <div className="sim-dials">
        <Dial label="aperture" values={APERTURES.slice(1)} value={n} onChange={setN} format={fLabel} />
        <Dial label="shutter" values={SHUTTERS} value={t} onChange={setT} format={shutterLabel} />
        <Dial label="film" values={ISOS} value={iso} onChange={setIso} format={(v) => `${v}`} />
      </div>
      <p className="sim-notes muted">
        {t > 1 / 60 ? "slower than 1/60 on a 50mm: watch for camera shake. " : ""}
        {n <= 2.8 ? "wide aperture: the background melts. " : n >= 11 ? "small aperture: near and far both sharp. " : ""}
        {iso >= 800 ? "fast film: you can see the grain." : ""}
      </p>
    </figure>
  );
}
