"use client";
// Your photographs: resized copies in IndexedDB (a display copy and a thumbnail), with the
// colour facts the wall filters by detected from the pixels. Nothing is uploaded from here.
import { useEffect, useState } from "react";
import { kv } from "./db";
import type { PhotoRec } from "@/engine/types";

export const DISPLAY = 1400, THUMB = 480;

async function resize(bmp: ImageBitmap, max: number, q: number): Promise<{ blob: Blob; data: ImageData; w: number; h: number }> {
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!; x.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", q));
  return { blob, data: x.getImageData(0, 0, w, h), w, h };
}

/** Is it black & white, and what's its dominant hue? */
export function analyse(img: ImageData): { mono: boolean; hue: number | null; sat: number } {
  const d = img.data, bins = new Float64Array(36);
  let satSum = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) {
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dd = mx - mn;
    n++;
    if (dd < 0.02) continue;
    const s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    satSum += s;
    if (l < 0.08 || l > 0.95) continue;
    let h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
    h *= 60;
    bins[Math.floor(h / 10) % 36] += s * s * (1 - Math.abs(l - 0.5));
  }
  const sat = n ? satSum / n : 0;
  let best = 0; for (let i = 1; i < 36; i++) if (bins[i] > bins[best]) best = i;
  const mono = sat < 0.06;
  return { mono, hue: mono || bins[best] === 0 ? null : best * 10 + 5, sat: Math.round(sat * 100) / 100 };
}

export async function prepare(file: Blob) {
  const bmp = await createImageBitmap(file);
  const disp = await resize(bmp, DISPLAY, 0.82);
  const th = await resize(bmp, THUMB, 0.76);
  bmp.close?.();
  return { display: disp.blob, thumb: th.blob, w: disp.w, h: disp.h, ...analyse(th.data) };
}

/** Make a thumbnail from a display copy (when a photo arrives from another device). */
export async function thumbFrom(display: Blob) {
  const bmp = await createImageBitmap(display);
  const th = await resize(bmp, THUMB, 0.76);
  return th.blob;
}

export const store = {
  save: async (id: string, display: Blob, thumb: Blob) => { await kv.set(`img:${id}`, display); await kv.set(`thumb:${id}`, thumb); bump(id); },
  get: (id: string, kind: "img" | "thumb") => kv.get<Blob>(`${kind}:${id}`),
  has: async () => new Set((await kv.keys()).filter((k) => k.startsWith("img:")).map((k) => k.slice(4))),
  drop: async (id: string) => { await kv.del(`img:${id}`); await kv.del(`thumb:${id}`); },
};

// tell mounted images when a photo's bytes arrive (e.g. from sync)
const listeners = new Set<(id: string) => void>();
export const bump = (id: string) => listeners.forEach((f) => f(id));

/** An object URL for a photo's thumbnail or display copy (or its external url). */
export function usePhotoSrc(rec: PhotoRec | undefined, kind: "img" | "thumb"): string | null {
  const [src, setSrc] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!rec) return;
    const f = (id: string) => id === rec.id && setTick((t) => t + 1);
    listeners.add(f); return () => { listeners.delete(f); };
  }, [rec]);
  useEffect(() => {
    if (!rec) return;
    if (rec.url) { setSrc(rec.url); return; }
    let url: string | null = null, live = true;
    store.get(rec.id, kind).then((b) => { if (b && live) { url = URL.createObjectURL(b); setSrc(url); } });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [rec?.id, rec?.url, kind, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}

/** colour families for the wall's swatch filter */
export const FAMILIES = [
  { id: "red", hue: 0, c: "#c8463c" }, { id: "orange", hue: 30, c: "#d9853a" }, { id: "yellow", hue: 55, c: "#d8c043" },
  { id: "green", hue: 110, c: "#5c9a50" }, { id: "teal", hue: 175, c: "#3f9c98" }, { id: "blue", hue: 220, c: "#4a72c0" },
  { id: "purple", hue: 275, c: "#8a5cb8" }, { id: "pink", hue: 325, c: "#c95a9a" },
];
export function family(hue: number | null): string | null {
  if (hue === null) return null;
  let best = FAMILIES[0], bd = 999;
  for (const f of FAMILIES) { const d = Math.min(Math.abs(hue - f.hue), 360 - Math.abs(hue - f.hue)); if (d < bd) { bd = d; best = f; } }
  return best.id;
}
