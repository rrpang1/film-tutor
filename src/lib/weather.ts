// Today's weather from Open-Meteo: free, no account, no key. Only a fixed city point is sent
// (never the device's location). The last forecast is cached so suggestions work offline.

export type Forecast = {
  fetchedAt: number;
  sunrise: number; sunset: number;
  now: { t: number; code: number; cloud: number; tempF: number; precip: number; wind: number };
  hours: { t: number; code: number; cloud: number; tempF: number }[];
};

const KEY = "ft-weather";

export function cachedForecast(): Forecast | null {
  try { const f = JSON.parse(localStorage.getItem(KEY) || "null") as Forecast | null; return f && Date.now() - f.fetchedAt < 18 * 3600_000 ? f : null; } catch { return null; }
}

export async function getForecast(lat: number, lon: number, tz: string): Promise<Forecast> {
  const c = cachedForecast();
  if (c && Date.now() - c.fetchedAt < 30 * 60_000) return c;
  const q = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), timezone: tz, timeformat: "unixtime", forecast_days: "2",
    current: "temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m",
    hourly: "temperature_2m,weather_code,cloud_cover", daily: "sunrise,sunset",
    temperature_unit: "fahrenheit", wind_speed_unit: "mph",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`weather service said ${r.status}`);
  const j = await r.json();
  const f: Forecast = {
    fetchedAt: Date.now(),
    sunrise: j.daily.sunrise[0] * 1000, sunset: j.daily.sunset[0] * 1000,
    now: { t: j.current.time * 1000, code: j.current.weather_code, cloud: j.current.cloud_cover, tempF: j.current.temperature_2m, precip: j.current.precipitation, wind: j.current.wind_speed_10m },
    hours: (j.hourly.time as number[]).map((t, i) => ({ t: t * 1000, code: j.hourly.weather_code[i], cloud: j.hourly.cloud_cover[i], tempF: j.hourly.temperature_2m[i] })),
  };
  try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* storage may be unavailable */ }
  return f;
}

/** The forecast hour nearest `t`, or the current conditions. */
export function at(f: Forecast, t: number) {
  if (Math.abs(t - Date.now()) < 45 * 60_000) return f.now;
  return f.hours.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a), f.hours[0]);
}
