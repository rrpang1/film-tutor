"use client";
import { useEffect } from "react";

/** Moves the sheen on leather and chrome with the cursor, like a lamp over hide. */
export default function LightSource() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const s = document.documentElement.style;
        s.setProperty("--mx", `${(e.clientX / innerWidth) * 100}%`);
        s.setProperty("--my", `${(e.clientY / innerHeight) * 100}%`);
      });
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
