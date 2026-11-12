"use client";
import { useEffect, useState } from "react";

/** The current time, refreshed each minute (so due counts tick over without a reload). */
export function useNow(every = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), every); return () => clearInterval(t); }, [every]);
  return now;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
