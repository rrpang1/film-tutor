// Ranking places to shoot against the time of day, the sky, the weekday and the season.
// Pure and subject-agnostic: a city guide is just data (see content/<subject>/city-*.ts).

export type Light = "golden-am" | "day" | "golden-pm" | "blue" | "night";
export type Sky = "clear" | "cloud" | "overcast" | "rain" | "snow" | "fog";

export type Spot = {
  id: string;
  name: string;
  area: string;
  /** what to photograph, in one line: "the skateboarders on the asphalt by avenue a" */
  subject: string;
  /** a short brief: what to look for and how */
  brief: string;
  /** technique hint, e.g. "1/500 to freeze, or 1/30 and pan" */
  technique: string;
  light: Light[];
  sky: Sky[];
  /** 0 = sunday … 6 = saturday; only these days */
  days?: number[];
  /** 1–12; only these months */
  months?: number[];
  indoor?: boolean;
  /** a lesson this spot practises */
  node?: string;
  /** a map search query */
  map: string;
};

export type Conditions = { light: Light; sky: Sky; tempF?: number; day: number; month: number; date: string };
export type Ranked = { spot: Spot; score: number; reasons: string[] };

const MIN = 60_000;

/** What the light is doing at `t`, given today's sunrise and sunset (ms). */
export function lightAt(t: number, sunrise: number, sunset: number): Light {
  if (t < sunrise - 35 * MIN || t > sunset + 35 * MIN) return "night";
  if (t < sunrise || t > sunset) return "blue";
  if (t < sunrise + 70 * MIN) return "golden-am";
  if (t > sunset - 70 * MIN) return "golden-pm";
  return "day";
}

/** Fallback when there's no forecast: rough NYC sunrise/sunset by month. */
export function roughSun(d: Date): { sunrise: number; sunset: number } {
  const rise = [7.2, 6.8, 7.0, 6.5, 5.8, 5.4, 5.6, 6.1, 6.6, 7.1, 6.6, 7.1][d.getMonth()];
  const set = [16.9, 17.5, 19.1, 19.6, 20.1, 20.5, 20.4, 19.8, 19.0, 18.2, 16.6, 16.4][d.getMonth()];
  const at = (h: number) => { const x = new Date(d); x.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0); return +x; };
  return { sunrise: at(rise), sunset: at(set) };
}

/** WMO weather code (as used by Open-Meteo) to a sky. */
export function skyFromCode(code: number, cloud?: number): Sky {
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 51) return "rain";
  if (code === 3) return "overcast";
  if (code === 2) return cloud !== undefined && cloud > 85 ? "overcast" : "cloud";
  return "clear";
}

export const LIGHT_WORDS: Record<Light, string> = { "golden-am": "morning golden hour", day: "daylight", "golden-pm": "evening golden hour", blue: "blue hour", night: "night" };
export const SKY_WORDS: Record<Sky, string> = { clear: "clear sun", cloud: "broken cloud", overcast: "overcast", rain: "rain", snow: "snow", fog: "fog" };

function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; }

export function rankSpots(spots: Spot[], c: Conditions): Ranked[] {
  const wet = c.sky === "rain" || c.sky === "snow";
  const cold = c.tempF !== undefined && c.tempF < 30;
  const out: Ranked[] = [];
  for (const s of spots) {
    if (s.days && !s.days.includes(c.day)) continue;
    if (s.months && !s.months.includes(c.month)) continue;
    const reasons: string[] = [];
    let score = 0;
    if (s.light.includes(c.light)) { score += 3; reasons.push(`made for ${LIGHT_WORDS[c.light]}`); }
    else if (c.light === "night" && !s.indoor) score -= 6;
    else score -= 1;
    if (s.sky.includes(c.sky)) { score += 3; if (!(s.indoor && wet)) reasons.push(c.sky === "clear" ? "the sun is out" : `${SKY_WORDS[c.sky]} suits it`); }
    else if (wet && !s.indoor) score -= 4;
    else score -= 1;
    if (s.indoor && (wet || cold)) { score += 2; reasons.push(wet ? "indoors, out of the weather" : "indoors, out of the cold"); }
    if (cold && !s.indoor) score -= 1;
    if (s.days) { score += 2; reasons.push("only on certain days, and today is one"); }
    if (s.months) { score += 1; reasons.push("seasonal, and it's the season"); }
    score += hash(c.date + s.id) * 1.5; // a gentle daily shuffle among equals
    out.push({ spot: s, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** The K1000's shutter speeds as fractions of a second (1 → 1s). */
const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000];
export const nearestSpeed = (denom: number) => SPEEDS.reduce((a, b) => (Math.abs(Math.log(b / denom)) < Math.abs(Math.log(a / denom)) ? b : a));

/** A sunny-16 starting point for the conditions, or null when it has to be metered. */
export function sunny16(sky: Sky, light: Light, iso: number): { f: number; speed: number; note: string } | null {
  if (light === "night" || light === "blue") return null;
  const f = light !== "day" ? (sky === "clear" ? 8 : 5.6) : ({ clear: 16, cloud: 11, overcast: 8, fog: 8, rain: 5.6, snow: 11 } as const)[sky];
  const note = light !== "day" ? "low sun: about two stops under sunny 16, but meter faces" : sky === "snow" ? "snow on the ground reflects light: about f/11–16, check the meter" : sky === "clear" ? "sunny 16" : `sunny 16, adjusted for ${SKY_WORDS[sky]}`;
  return { f, speed: nearestSpeed(iso), note };
}
