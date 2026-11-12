"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dial from "./Dial";
import { APERTURES, SHUTTERS, fLabel, shutterLabel, settingEv } from "./expo";

const CONDITIONS = [
  { name: "snow in full sun", f: 22, shadows: "blinding, crisp shadows", sun: 1, cloud: 0 },
  { name: "bright sun", f: 16, shadows: "hard, sharp-edged shadows", sun: 1, cloud: 0 },
  { name: "slight overcast", f: 11, shadows: "soft-edged shadows", sun: 0.7, cloud: 0.4 },
  { name: "overcast", f: 8, shadows: "barely any shadows", sun: 0.3, cloud: 0.8 },
  { name: "heavy overcast", f: 5.6, shadows: "no shadows, dull light", sun: 0, cloud: 1 },
  { name: "open shade or sunset", f: 4, shadows: "you're out of the sun", sun: 0.2, cloud: 0.3 },
];
const ISOS = [100, 200, 400];

/** A drill: a sky appears, you dial an exposure, it's scored in stops. */
export default function Sunny16() {
  const [seed, setSeed] = useState(1);
  const round = useMemo(() => ({ c: CONDITIONS[(seed * 7) % CONDITIONS.length], iso: ISOS[(seed * 5) % 3] }), [seed]);
  const [n, setN] = useState(8);
  const [t, setT] = useState(1 / 125);
  const [shown, setShown] = useState<null | number>(null);
  const [streak, setStreak] = useState(0);

  const check = () => {
    const ideal = settingEv(round.c.f, 1 / round.iso);
    const err = Math.round((ideal - settingEv(n, t)) * 3) / 3;
    setShown(err);
    setStreak((s) => (Math.abs(err) <= 1 ? s + 1 : 0));
  };
  const next = () => { setShown(null); setSeed((s) => s + 1 + Math.floor(Math.random() * 4)); };

  return (
    <figure className="widget brushed s16">
      <figcaption className="widget-head">
        <span className="display">sunny 16 drill</span>
        <span className="muted">no meter. read the light, dial it in. within a stop counts on negative film.</span>
      </figcaption>
      <div className="s16-sky" style={{ ["--sun" as string]: round.c.sun, ["--cloud" as string]: round.c.cloud }}>
        <span className="s16-sun" /><span className="s16-cloud" />
        <div className="s16-card glass">
          <b>{round.c.name}</b>
          <span>{round.c.shadows}</span>
          <span className="chip">ISO {round.iso} film</span>
        </div>
      </div>
      <div className="sim-dials">
        <Dial label="aperture" values={APERTURES.slice(1)} value={n} onChange={setN} format={fLabel} />
        <Dial label="shutter" values={SHUTTERS.slice(4)} value={t} onChange={setT} format={shutterLabel} />
      </div>
      <div className="s16-foot">
        <AnimatePresence mode="wait">
          {shown === null ? (
            <motion.button key="c" className="btn ink" onClick={check} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>check exposure</motion.button>
          ) : (
            <motion.div key="r" className="s16-result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className={Math.abs(shown) <= 1 ? "good" : "bad"}>
                {Math.abs(shown) < 0.4 ? "spot on." : `${Math.abs(shown).toFixed(1)} stops ${shown > 0 ? "over" : "under"}.`}
              </span>
              <span className="muted">sunny 16 says {fLabel(round.c.f)} at about 1/{round.iso}, or any equivalent.</span>
              <button className="btn ghost" onClick={next}>next sky</button>
            </motion.div>
          )}
        </AnimatePresence>
        {streak > 1 && <span className="chip live">{streak} in a row</span>}
      </div>
    </figure>
  );
}
