"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A section floating in the field: its own parallax speed and tilt, and a focus pull
 * (blur → sharp) as it reaches the middle of the viewport.
 */
export default function Float({ children, speed = 0.08, tilt = 0, style, className }: {
  children: ReactNode; speed?: number; tilt?: number; style?: CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [tilt * 1.6, tilt, tilt * 0.4]);
  const blur = useTransform(scrollYProgress, [0, 0.22, 0.78, 1], [6, 0, 0, 5]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.85, 1], [0.35, 1, 1, 0.5]);
  if (still) return <div ref={ref} className={className} style={style}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y, rotate, filter, opacity, willChange: "transform, filter" }}>
      {children}
    </motion.div>
  );
}
