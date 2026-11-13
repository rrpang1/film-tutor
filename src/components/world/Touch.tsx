"use client";
import { useEffect, useRef } from "react";

/**
 * The interaction layer, drawn on one canvas above the page:
 * - a ring of light where you click
 * - sparks that lift off whatever you type into
 * - [data-magnet] elements lean toward the cursor
 */
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; kind: "spark" | "ring" };

export default function Touch() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!, ctx = cv.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size(); addEventListener("resize", size);

    const ps: P[] = [];
    const cur = { x: innerWidth / 2, y: innerHeight / 2 };

    const onMove = (e: PointerEvent) => {
      cur.x = e.clientX; cur.y = e.clientY;
      for (const el of document.querySelectorAll<HTMLElement>("[data-magnet]")) {
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const dx = cur.x - cx, dy = cur.y - cy, d = Math.hypot(dx, dy), reach = Math.max(b.width, b.height) * 0.9 + 40;
        const k = d < reach ? (1 - d / reach) * 0.25 : 0;
        el.style.translate = `${dx * k}px ${dy * k}px`;
      }
    };
    const onDown = (e: PointerEvent) => {
      ps.push({ x: e.clientX, y: e.clientY, vx: 0, vy: 0, life: 0, max: 26, size: 0, kind: "ring" });
    };
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLInputElement | null;
      if (!el || !("value" in el) || e.key.length > 1) return;
      const b = el.getBoundingClientRect();
      // approximate caret position from text width
      const c = document.createElement("canvas").getContext("2d")!;
      c.font = getComputedStyle(el).font;
      const x = Math.min(b.right - 8, b.left + 12 + c.measureText(el.value).width);
      const y = b.top + b.height / 2;
      ps.push({ x, y: y - 6, vx: (Math.random() - 0.5) * 0.3, vy: -0.5 - Math.random() * 0.4, life: 0, max: 34, size: 1.1, kind: "spark" });
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("keydown", onKey);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.life++;
        const k = p.life / p.max;
        if (k >= 1) { ps.splice(i, 1); continue; }
        if (p.kind === "ring") {
          const e = 1 - Math.pow(1 - k, 3);
          const rad = 6 + e * 26, a = 0.5 * (1 - k);
          ctx.strokeStyle = `rgba(34,42,52,${a})`; ctx.lineWidth = 0.75;
          ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.stroke();
          // four registration ticks that slide outward
          const r0 = rad + 4, r1 = rad + 9;
          ctx.beginPath();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(p.x + dx * r0, p.y + dy * r0); ctx.lineTo(p.x + dx * r1, p.y + dy * r1); }
          ctx.stroke();
        } else {
          p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy = p.vy * 0.97 - 0.015;
          ctx.fillStyle = `rgba(34,42,52,${0.4 * (1 - k)})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size); removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown); removeEventListener("keydown", onKey);
    };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 60, pointerEvents: "none" }} />;
}
