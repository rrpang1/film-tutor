"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { defaultPack } from "@/lib/packs";
import { rankFor } from "@/engine/xp";

/**
 * Moments worth a pause. A developed frame rises out of the tray (black base → print),
 * and a finished roll rewinds into its canister.
 */
export default function Ceremonies() {
  const { ceremonies, dismiss } = useStore();
  const c = ceremonies[0];
  return (
    <AnimatePresence>
      {c && c.kind !== "toast" && (
        <motion.div key={c.kind + (c.kind === "level" ? c.level : c.node.id)} className="cer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} onClick={dismiss} role="dialog" aria-live="polite">
          {c.kind === "develop" ? (
            <div className="cer-inner" onClick={(e) => e.stopPropagation()}>
              <p className="cer-kicker">developed</p>
              <div className="cer-tray">
                <motion.div className="cer-print paper"
                  initial={{ filter: "brightness(0.08) sepia(1) blur(6px)", y: 20, rotate: -2 }}
                  animate={{ filter: ["brightness(0.08) sepia(1) blur(6px)", "brightness(0.5) sepia(0.6) blur(2px)", "brightness(1) sepia(0) blur(0px)"], y: 0, rotate: -1.2 }}
                  transition={{ duration: 2.4, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] }}>
                  <span className="display">{c.node.title}</span>
                  <span className="cer-sub">{c.node.blurb}</span>
                </motion.div>
                <motion.span className="cer-ripple" initial={{ scale: 0.4, opacity: 0.6 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 2.2, repeat: 1, ease: "easeOut" }} />
              </div>
              <motion.p className="cer-gain" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
                +{c.gained} {defaultPack.unit[1]} exposed. Its cards are in the darkroom now.
              </motion.p>
              {c.unlocked.length > 0 && (
                <motion.div className="cer-unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                  <p>new frames are latent:</p>
                  <div>{c.unlocked.map((n, k) => (
                    <motion.span key={n.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.1 + k * 0.12 }}>
                      <Link href={`/frame/${n.id}/`} className="chip live" onClick={dismiss}>{n.title}</Link>
                    </motion.span>
                  ))}</div>
                </motion.div>
              )}
              <motion.button className="btn ink" onClick={dismiss} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>back to work</motion.button>
            </div>
          ) : (
            <div className="cer-inner" onClick={(e) => e.stopPropagation()}>
              <p className="cer-kicker">roll {c.level - 1} developed</p>
              <motion.div className="cer-can" initial={{ rotate: 0 }} animate={{ rotate: -1080 }} transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}>
                <span className="chrome" /><span className="filmbase" /><span className="chrome" />
              </motion.div>
              <motion.h2 className="display cer-rank" initial={{ opacity: 0, letterSpacing: "0.3em", filter: "blur(10px)" }} animate={{ opacity: 1, letterSpacing: "-0.02em", filter: "blur(0px)" }} transition={{ delay: 1.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
                {rankFor(c.level, defaultPack.ranks).title}
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                roll {c.level} is loaded: {rankFor(c.level, defaultPack.ranks).line}
              </motion.p>
              <motion.button className="btn signal" onClick={dismiss} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }}>keep shooting</motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
