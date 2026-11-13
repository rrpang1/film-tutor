"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BANDS, develop, histogram, neutral, testScene, type Dev } from "./develop-math";

type Panel = "wb" | "basic" | "curve" | "hsl" | "grade" | "bw";
type Num = Exclude<keyof Dev, "hsl" | "mono" | "mix">;
type Ctl = { k: Num; label: string; min: number; max: number; step?: number; track?: string };

const HUE_TRACK = "linear-gradient(90deg,#e33,#e93,#ee3,#3c3,#3cc,#36e,#93e,#e3c,#e33)";
const CONTROLS: Record<Exclude<Panel, "hsl" | "bw">, Ctl[]> = {
  wb: [
    { k: "temp", label: "temp", min: -100, max: 100, track: "linear-gradient(90deg,#4a7fd0,#ddd,#e0b030)" },
    { k: "tint", label: "tint", min: -100, max: 100, track: "linear-gradient(90deg,#3fa040,#ddd,#c040b0)" },
  ],
  basic: [
    { k: "exposure", label: "exposure", min: -2, max: 2, step: 0.05 },
    { k: "contrast", label: "contrast", min: -100, max: 100 },
    { k: "highlights", label: "highlights", min: -100, max: 100 },
    { k: "shadows", label: "shadows", min: -100, max: 100 },
    { k: "whites", label: "whites", min: -100, max: 100 },
    { k: "blacks", label: "blacks", min: -100, max: 100 },
    { k: "vibrance", label: "vibrance", min: -100, max: 100 },
    { k: "saturation", label: "saturation", min: -100, max: 100 },
  ],
  curve: [
    { k: "fade", label: "lift blacks (fade)", min: 0, max: 100 },
    { k: "cShadow", label: "shadows point", min: -100, max: 100 },
    { k: "cMid", label: "midtones point", min: -100, max: 100 },
    { k: "cHigh", label: "highlights point", min: -100, max: 100 },
    { k: "cWhite", label: "lower whites", min: 0, max: 100 },
  ],
  grade: [
    { k: "gShH", label: "shadows hue", min: 0, max: 360, track: HUE_TRACK },
    { k: "gShS", label: "shadows saturation", min: 0, max: 100 },
    { k: "gMiH", label: "midtones hue", min: 0, max: 360, track: HUE_TRACK },
    { k: "gMiS", label: "midtones saturation", min: 0, max: 100 },
    { k: "gHiH", label: "highlights hue", min: 0, max: 360, track: HUE_TRACK },
    { k: "gHiS", label: "highlights saturation", min: 0, max: 100 },
    { k: "balance", label: "balance", min: -100, max: 100 },
  ],
};
const TITLES: Record<Panel, [string, string]> = {
  wb: ["white balance", "warm it, cool it, then find neutral. Watch the grey card."],
  basic: ["the basic panel", "drag, then watch the histogram. Press clip to see what you've lost."],
  curve: ["the tone curve", "five points on a curve. Try an s-curve: shadows down, highlights up."],
  hsl: ["the hsl mixer", "pick a colour band, then move its hue, saturation or luminance."],
  grade: ["colour grading", "tint the shadows, midtones and highlights separately. Keep saturation low."],
  bw: ["black & white mix", "each slider lightens or darkens what used to be that colour."],
};
const SWATCH = ["#d33", "#e83", "#dc3", "#4a4", "#3bb", "#36c", "#83c", "#c3a"];
const W = 480, H = 320;

function fit(img: HTMLImageElement | ImageBitmap): ImageData {
  const c = document.createElement("canvas");
  const s = Math.min(W / img.width, H / img.height, 1) * 1;
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const x = c.getContext("2d")!; x.drawImage(img, 0, 0, c.width, c.height);
  return x.getImageData(0, 0, c.width, c.height);
}

export type { Panel };
export default function Develop({ panel: initial = "basic", histogram: showHist = true, image, panels }: { panel?: Panel; histogram?: boolean; image?: Blob | null; panels?: Panel[] }) {
  const [panel, setPanel] = useState<Panel>(initial);
  const [d, setD] = useState<Dev>(() => ({ ...neutral(), mono: initial === "bw" }));
  const [band, setBand] = useState(5);
  const [before, setBefore] = useState(false);
  const [clip, setClip] = useState(false);
  const [src, setSrc] = useState<ImageData | null>(null);
  const cv = useRef<HTMLCanvasElement>(null), hv = useRef<HTMLCanvasElement>(null), file = useRef<HTMLInputElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    if (image) createImageBitmap(image).then((b) => setSrc(fit(b))).catch(() => setSrc(testScene(W, H)));
    else setSrc(testScene(W, H));
  }, [image]);
  const out = useMemo(() => (src ? new ImageData(src.width, src.height) : null), [src]);

  useEffect(() => {
    if (!src || !out) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const c = cv.current!; c.width = src.width; c.height = src.height;
      const img = before ? src : develop(src, d, out);
      const ctx = c.getContext("2d")!;
      if (clip && !before) {
        const v = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), a = v.data;
        for (let i = 0; i < a.length; i += 4) {
          if (a[i] > 252 || a[i + 1] > 252 || a[i + 2] > 252) { a[i] = 255; a[i + 1] = 30; a[i + 2] = 30; }
          else if (a[i] < 3 && a[i + 1] < 3 && a[i + 2] < 3) { a[i] = 30; a[i + 1] = 80; a[i + 2] = 255; }
        }
        ctx.putImageData(v, 0, 0);
      } else ctx.putImageData(img, 0, 0);
      if (showHist && hv.current) {
        const hs = histogram(img), hc = hv.current.getContext("2d")!, hw = hv.current.width, hh = hv.current.height;
        hc.clearRect(0, 0, hw, hh);
        const max = Math.max(...hs[3], ...hs[0], ...hs[1], ...hs[2]) || 1;
        const cols = ["rgb(220 60 60 / 0.45)", "rgb(60 170 80 / 0.45)", "rgb(70 110 220 / 0.45)", "rgb(30 34 40 / 0.35)"];
        hc.globalCompositeOperation = "multiply";
        hs.forEach((ch, k) => {
          hc.fillStyle = cols[k]; hc.beginPath(); hc.moveTo(0, hh);
          ch.forEach((n, i) => hc.lineTo((i / (ch.length - 1)) * hw, hh - Math.sqrt(n / max) * hh));
          hc.lineTo(hw, hh); hc.fill();
        });
        hc.globalCompositeOperation = "source-over";
      }
    });
  }, [src, out, d, before, clip, showHist]);

  const set = (k: Num, v: number) => setD((x) => ({ ...x, [k]: v }));
  const load = async (f: File) => {
    try { const bmp = await createImageBitmap(f); setSrc(fit(bmp)); } catch { alert("That file couldn't be opened as an image."); }
  };
  const [title, line] = TITLES[panel];

  const slider = (key: string, label: string, value: number, min: number, max: number, on: (v: number) => void, step = 1, track?: string) => (
    <label className="dev-row" key={key}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} onDoubleClick={() => on(key.startsWith("g") && key.endsWith("H") ? value : 0)} style={track ? { background: track } : undefined} className={track ? "tracked" : undefined} />
      <output>{step < 1 ? value.toFixed(2) : Math.round(value)}</output>
    </label>
  );

  return (
    <figure className="widget brushed develop">
      <figcaption className="widget-head"><span className="display">{title}</span><span className="muted">{line}</span></figcaption>
      {panels && (
        <div className="dev-tabs" role="tablist">
          {panels.map((x) => <button key={x} role="tab" aria-selected={panel === x} className={`chip${panel === x ? " live" : ""}`} onClick={() => { setPanel(x); if (x === "bw") setD((v) => ({ ...v, mono: true })); }}>{TITLES[x][0]}</button>)}
        </div>
      )}
      <div className="dev-stage">
        <canvas ref={cv} className="dev-img" aria-label="the photo being edited" />
        {showHist && <canvas ref={hv} width={240} height={70} className="dev-hist" aria-label="histogram" />}
      </div>
      <div className="dev-bar">
        <button className={`chip${before ? " live" : ""}`} onPointerDown={() => setBefore(true)} onPointerUp={() => setBefore(false)} onPointerLeave={() => setBefore(false)}>hold: before</button>
        <button className={`chip${clip ? " live" : ""}`} onClick={() => setClip((c) => !c)} aria-pressed={clip}>clip (J)</button>
        <button className="chip" onClick={() => setD({ ...neutral(), mono: panel === "bw" })}>reset</button>
        <button className="chip" onClick={() => file.current?.click()}>use my photo</button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </div>
      <div className="dev-controls">
        {(panel === "wb" || panel === "basic" || panel === "curve" || panel === "grade") && CONTROLS[panel].map((c) => slider(c.k, c.label, d[c.k], c.min, c.max, (v) => set(c.k, v), c.step, c.track))}
        {panel === "hsl" && (
          <>
            <div className="dev-bands" role="radiogroup" aria-label="colour band">
              {BANDS.map((b, i) => <button key={b} role="radio" aria-checked={band === i} className={`dev-band${band === i ? " on" : ""}`} style={{ background: SWATCH[i] }} onClick={() => setBand(i)} title={b}><span className="sr">{b}</span></button>)}
              <span className="muted">{BANDS[band]}</span>
            </div>
            {(["hue", "saturation", "luminance"] as const).map((nm, j) => slider(`hsl${j}`, nm, d.hsl[band][j], -100, 100, (v) => setD((x) => ({ ...x, hsl: x.hsl.map((t, i) => (i === band ? (t.map((y, q) => (q === j ? v : y)) as [number, number, number]) : t)) }))))}
          </>
        )}
        {panel === "bw" && (
          <>
            <label className="chip live" style={{ alignSelf: "flex-start" }}><input type="checkbox" checked={d.mono} onChange={(e) => setD((x) => ({ ...x, mono: e.target.checked }))} /> black & white (V)</label>
            {BANDS.map((b, i) => slider(`mix${i}`, b, d.mix[i], -100, 100, (v) => setD((x) => ({ ...x, mix: x.mix.map((y, q) => (q === i ? v : y)) })), 1, `linear-gradient(90deg,#222,${SWATCH[i]},#eee)`))}
          </>
        )}
      </div>
      <p className="muted dev-note">The photo never leaves your device. Double-click a slider to reset it.</p>
    </figure>
  );
}
