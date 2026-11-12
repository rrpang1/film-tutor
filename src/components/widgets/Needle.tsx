"use client";
import { motion } from "framer-motion";

/** The K1000's match-needle meter: + above, − below, centred is correct. */
export default function Needle({ error }: { error: number }) {
  const clamped = Math.max(-2.5, Math.min(2.5, error));
  const angle = -clamped * 18; // + (over) swings up
  const ok = Math.abs(error) < 0.5;
  return (
    <div className="needle filmbase" aria-label={ok ? "meter centred" : error > 0 ? `${error.toFixed(1)} stops over` : `${(-error).toFixed(1)} stops under`}>
      <svg viewBox="0 0 60 120" width="60" height="120" aria-hidden>
        <text x="40" y="20" fill="currentColor" fontSize="14" textAnchor="middle">+</text>
        <text x="40" y="112" fill="currentColor" fontSize="14" textAnchor="middle">−</text>
        <rect x="34" y="57" width="12" height="6" rx="1" fill={ok ? "var(--signal)" : "rgb(241 242 244 / .35)"} />
        <motion.line x1="4" y1="60" x2="40" y2="60" stroke="var(--bone)" strokeWidth="1.6" strokeLinecap="round"
          style={{ originX: 0, originY: 0.5 }} animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 140, damping: 9, mass: 0.6 }} />
        <circle cx="4" cy="60" r="3" fill="var(--steel)" />
      </svg>
    </div>
  );
}
