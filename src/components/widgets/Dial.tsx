"use client";
import { motion } from "framer-motion";

/** A stepped control that reads like a camera dial: tap a value, or nudge with the arrows. */
export default function Dial<T>({ label, values, value, onChange, format }: {
  label: string; values: T[]; value: T; onChange: (v: T) => void; format: (v: T) => string;
}) {
  const i = values.indexOf(value);
  const step = (d: number) => onChange(values[Math.max(0, Math.min(values.length - 1, i + d))]);
  return (
    <div className="dial" role="group" aria-label={label}>
      <span className="dial-label">{label}</span>
      <div className="dial-row">
        <button className="dial-nudge" onClick={() => step(-1)} aria-label={`${label} down`} disabled={i <= 0}>‹</button>
        <div className="dial-track" onKeyDown={(e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }}>
          {values.map((v, k) => (
            <button key={k} className={`dial-v${k === i ? " on" : ""}`} onClick={() => onChange(v)} aria-pressed={k === i}>
              {k === i && <motion.span layoutId={`dial-${label}`} className="dial-on chrome" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span>{format(v)}</span>
            </button>
          ))}
        </div>
        <button className="dial-nudge" onClick={() => step(1)} aria-label={`${label} up`} disabled={i >= values.length - 1}>›</button>
      </div>
    </div>
  );
}
