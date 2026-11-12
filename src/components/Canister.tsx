"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { defaultPack } from "@/lib/packs";
import { levelFromXp, rankFor, totalXp } from "@/engine/xp";
import { achievements } from "@/engine/achievements";
import { benchDays } from "@/engine/progress";
import { useNow } from "@/lib/hooks";
import Sheet from "./Sheet";

/** The level HUD: a film canister. Its edge print counts frames on the current roll. */
export default function Canister() {
  const { p } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const xp = totalXp(p);
  const L = levelFromXp(xp);
  const rank = rankFor(L.level, defaultPack.ranks);
  const pct = L.into / L.length;
  const ach = achievements(defaultPack, p, now);
  return (
    <>
      <button className="canister" onClick={() => setOpen(true)} data-magnet aria-label={`roll ${L.level}, ${L.into} of ${L.length} frames. open progress`}>
        <span className="can-cap chrome" />
        <span className="can-body filmbase">
          <span className="can-roll display">{L.level}</span>
          <span className="can-count">{L.into}/{L.length}</span>
          <motion.span className="can-fill" initial={false} animate={{ scaleX: pct }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </span>
        <span className="can-cap chrome" />
        <span className="can-leader" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="your progress">
        <div className="prog">
          <p className="muted" style={{ margin: 0 }}>roll {L.level}</p>
          <h2 className="display" style={{ fontSize: "var(--t-xl)", margin: "4px 0 6px" }}>{rank.title}</h2>
          <p style={{ margin: "0 0 18px", color: "var(--ink-2)" }}>{rank.line}</p>
          <div className="prog-strip filmbase" aria-label={`${L.into} of ${L.length} frames exposed`}>
            {Array.from({ length: L.length }, (_, i) => <i key={i} className={i < L.into ? "on" : ""} />)}
          </div>
          <p className="muted" style={{ fontSize: "var(--t-s)" }}>
            {L.length - L.into} {defaultPack.unit[1]} until this roll is developed. {xp} {defaultPack.unit[1]} exposed in total, {benchDays(p, now)} {benchDays(p, now) === 1 ? "day" : "days"} at the bench in a row.
          </p>
          <h3 className="display" style={{ fontSize: "var(--t-l)", margin: "24px 0 10px" }}>keepers</h3>
          <ul className="ach">
            {ach.map((a) => (
              <li key={a.id} className={a.got ? "got" : ""}>
                <span className="ach-mark" aria-hidden />
                <span><b>{a.title}</b><br /><span className="muted">{a.line}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>
    </>
  );
}
