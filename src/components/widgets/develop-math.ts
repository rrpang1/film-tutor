// A tiny, honest approximation of a Lightroom-style develop pipeline, for teaching.
// Pure functions over ImageData so they can be tested and reused.

export const BANDS = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"] as const;
const CENTERS = [0, 30, 60, 120, 180, 240, 270, 300];

export type Dev = {
  temp: number; tint: number; exposure: number; contrast: number;
  highlights: number; shadows: number; whites: number; blacks: number;
  vibrance: number; saturation: number;
  fade: number; cShadow: number; cMid: number; cHigh: number; cWhite: number;
  hsl: [h: number, s: number, l: number][];
  mono: boolean; mix: number[];
  gShH: number; gShS: number; gMiH: number; gMiS: number; gHiH: number; gHiS: number; balance: number;
};

export const neutral = (): Dev => ({
  temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  vibrance: 0, saturation: 0, fade: 0, cShadow: 0, cMid: 0, cHigh: 0, cWhite: 0,
  hsl: BANDS.map(() => [0, 0, 0] as [number, number, number]),
  mono: false, mix: BANDS.map(() => 0),
  gShH: 210, gShS: 0, gMiH: 40, gMiS: 0, gHiH: 40, gHiS: 0, balance: 0,
});

const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** weights of the two hue bands either side of h (degrees) */
function bandWeights(h: number): [number, number, number] {
  for (let i = 0; i < CENTERS.length; i++) {
    const a = CENTERS[i], b = i === CENTERS.length - 1 ? 360 : CENTERS[i + 1];
    if (h >= a && h < b) return [i, (i + 1) % CENTERS.length, (h - a) / (b - a)];
  }
  return [0, 1, 0];
}

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-6) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hue2(p: number, q: number, t: number) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, k = (((h % 360) + 360) % 360) / 360;
  return [hue2(p, q, k + 1 / 3), hue2(p, q, k), hue2(p, q, k - 1 / 3)];
}
/** a unit tint vector for a hue, centred on zero */
export function tintOf(h: number): [number, number, number] { const [r, g, b] = hsl2rgb(h, 1, 0.5); return [r - 0.5, g - 0.5, b - 0.5]; }

function curve(x: number, d: Dev) {
  const pts: [number, number][] = [[0, d.fade / 100 * 0.35], [0.25, 0.25 + d.cShadow / 100 * 0.18], [0.5, 0.5 + d.cMid / 100 * 0.18], [0.75, 0.75 + d.cHigh / 100 * 0.18], [1, 1 - d.cWhite / 100 * 0.3]];
  for (let i = 0; i < 4; i++) if (x <= pts[i + 1][0]) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return pts[4][1];
}

export function develop(src: ImageData, d: Dev, out: ImageData) {
  const s = src.data, o = out.data;
  const ev = Math.pow(2, d.exposure), wbR = 1 + d.temp * 0.004, wbB = 1 - d.temp * 0.004, wbG = 1 - d.tint * 0.003;
  const tSh = tintOf(d.gShH), tMi = tintOf(d.gMiH), tHi = tintOf(d.gHiH);
  const anyHsl = d.hsl.some(([a, b, c]) => a || b || c), anyGrade = d.gShS || d.gMiS || d.gHiS;
  const curved = d.fade || d.cShadow || d.cMid || d.cHigh || d.cWhite;
  for (let i = 0; i < s.length; i += 4) {
    // white balance and exposure in (approximately) linear light
    let r = Math.pow(s[i] / 255, 2.2) * wbR * ev, g = Math.pow(s[i + 1] / 255, 2.2) * wbG * ev, b = Math.pow(s[i + 2] / 255, 2.2) * wbB * ev;
    r = Math.pow(Math.max(0, r), 1 / 2.2); g = Math.pow(Math.max(0, g), 1 / 2.2); b = Math.pow(Math.max(0, b), 1 / 2.2);

    // tone, on luminance, added back to all channels so hue holds
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let T = L;
    if (d.contrast) { const S = clamp(T) * clamp(T) * (3 - 2 * clamp(T)); T = d.contrast > 0 ? T + (S - T) * d.contrast / 100 * 1.4 : 0.5 + (T - 0.5) * (1 + d.contrast / 160); }
    if (d.highlights) T += d.highlights / 100 * 0.28 * smooth(0.45, 1, T);
    if (d.shadows) T += d.shadows / 100 * 0.28 * (1 - smooth(0, 0.55, T));
    if (d.whites) T += d.whites / 100 * 0.2 * smooth(0.55, 1, T);
    if (d.blacks) T += d.blacks / 100 * 0.15 * (1 - smooth(0, 0.35, T));
    if (curved) T = curve(clamp(T), d);
    r += T - L; g += T - L; b += T - L;

    // colour
    let [h, sat, l] = rgb2hsl(clamp(r), clamp(g), clamp(b));
    const sat0 = sat;
    if (anyHsl && sat > 0.02) {
      const [a, c, t] = bandWeights(h);
      const A = d.hsl[a], C = d.hsl[c];
      h += ((1 - t) * A[0] + t * C[0]) * 0.3;
      sat *= 1 + ((1 - t) * A[1] + t * C[1]) / 100;
      l += ((1 - t) * A[2] + t * C[2]) / 100 * 0.25 * Math.min(1, sat * 2);
    }
    if (d.vibrance) sat *= 1 + d.vibrance / 100 * (1 - sat) * (h > 10 && h < 50 ? 0.5 : 1);
    if (d.saturation) sat *= 1 + d.saturation / 100;
    if (d.mono) {
      let m = l;
      if (sat0 > 0.02) { const [a, c, t] = bandWeights(h); m += ((1 - t) * d.mix[a] + t * d.mix[c]) / 100 * 0.3 * sat0; }
      r = g = b = m;
    } else [r, g, b] = hsl2rgb(h, clamp(sat), clamp(l));

    // grading: tints weighted by tone range
    if (anyGrade) {
      const Y = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b), bal = d.balance / 100 * 0.3;
      const ws = (1 - smooth(0, 0.5 + bal, Y)), wh = smooth(0.5 + bal, 1, Y), wm = Math.max(0, 1 - ws - wh);
      const k = 0.32 / 100;
      r += (tSh[0] * d.gShS * ws + tMi[0] * d.gMiS * wm + tHi[0] * d.gHiS * wh) * k;
      g += (tSh[1] * d.gShS * ws + tMi[1] * d.gMiS * wm + tHi[1] * d.gHiS * wh) * k;
      b += (tSh[2] * d.gShS * ws + tMi[2] * d.gMiS * wm + tHi[2] * d.gHiS * wh) * k;
    }
    o[i] = clamp(r) * 255; o[i + 1] = clamp(g) * 255; o[i + 2] = clamp(b) * 255; o[i + 3] = 255;
  }
  return out;
}

/** 64-bin histograms for r, g, b and luma */
export function histogram(img: ImageData, bins = 64) {
  const h = [new Uint32Array(bins), new Uint32Array(bins), new Uint32Array(bins), new Uint32Array(bins)];
  const d = img.data, k = bins / 256;
  for (let i = 0; i < d.length; i += 4) {
    h[0][(d[i] * k) | 0]++; h[1][(d[i + 1] * k) | 0]++; h[2][(d[i + 2] * k) | 0]++;
    h[3][((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * k) | 0]++;
  }
  return h;
}

/** A painted test scene: sky with a sun, foliage, a grey card, a red coat, skin and a yellow cab. */
export function testScene(w: number, h: number): ImageData {
  const img = new ImageData(w, h), d = img.data;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);
  const horizon = 0.56;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    let c: number[];
    if (v < horizon - 0.06 * Math.sin(u * 5.2) * (u > 0.45 ? 1 : 0.3)) {
      c = mix([52, 98, 168], [196, 214, 232], Math.pow(v / horizon, 1.4));
      const ds = Math.hypot((u - 0.78) * 1.5, v - 0.2);
      c = mix(c, [255, 236, 200], Math.max(0, 1 - ds * 3.2));
      if (ds < 0.05) c = [255, 255, 250];
    } else if (v < 0.74) {
      const n = Math.sin(u * 60 + v * 30) * 0.5 + Math.sin(u * 23 - v * 50) * 0.5;
      c = mix([62, 104, 50], [138, 160, 70], 0.4 + n * 0.3 + (v - horizon) * 1.2);
    } else {
      c = mix([118, 120, 124], [70, 72, 76], (v - 0.74) / 0.26);
    }
    // a dark doorway (deep shadow detail)
    if (u > 0.04 && u < 0.17 && v > 0.36 && v < 0.86) c = mix([22, 24, 28], [44, 40, 38], (v - 0.36) * 0.6 + (Math.sin(u * 200) > 0.95 ? 0.4 : 0));
    // a grey card
    if (u > 0.2 && u < 0.28 && v > 0.62 && v < 0.78) c = [118, 118, 118];
    // a yellow cab
    if (u > 0.54 && u < 0.9 && v > 0.7 && v < 0.88) c = v < 0.76 && u > 0.6 && u < 0.84 ? [40, 46, 54] : [234, 178, 28];
    if ((Math.hypot((u - 0.61) * 1.5, v - 0.89) < 0.04) || (Math.hypot((u - 0.83) * 1.5, v - 0.89) < 0.04)) c = [24, 24, 26];
    // a figure: red coat, skin
    if (Math.hypot((u - 0.4) * 1.5, v - 0.47) < 0.045) c = [214, 160, 126];
    if (u > 0.37 && u < 0.43 && v > 0.51 && v < 0.84) c = mix([182, 44, 38], [120, 28, 26], (u - 0.37) / 0.06);
    const gr = (rnd() - 0.5) * 14;
    d.set([c[0] + gr, c[1] + gr, c[2] + gr, 255].map((z) => Math.max(0, Math.min(255, z))), (y * w + x) * 4);
  }
  return img;
}
