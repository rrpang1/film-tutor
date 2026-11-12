"use client";
import { useEffect, type ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import HazeField from "./world/HazeField";
import Touch from "./world/Touch";
import LightSource from "./world/LightSource";
import Dock from "./Dock";
import Ceremonies from "./Ceremonies";

export default function Shell({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sw.js`).catch(() => {});
    }
  }, []);
  return (
    <StoreProvider>
      <HazeField />
      <div className="worldtex" aria-hidden />
      <LightSource />
      <main>{children}</main>
      <Dock />
      <Ceremonies />
      <Touch />
      <div className="grain" aria-hidden />
    </StoreProvider>
  );
}
