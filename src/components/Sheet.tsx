"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

/** A frosted sheet that rises from the bottom on phones and floats centred on wide screens. */
export default function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <motion.div
            role="dialog" aria-modal aria-label={label}
            className="sheet glass"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0, scale: 0.97, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ y: 40, opacity: 0, scale: 0.98, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <button className="sheet-close" onClick={onClose} aria-label="close">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
