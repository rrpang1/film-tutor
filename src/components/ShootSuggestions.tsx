"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { nyc } from "@content/film/city-nyc";
import { LIGHT_WORDS, SKY_WORDS, lightAt, rankSpots, roughSun, skyFromCode, sunny16, type Sky } from "@/engine/shoots";
import { at, cachedForecast, getForecast, type Forecast } from "@/lib/weather";
import { defaultPack as pack } from "@/lib/packs";
import { useNow } from "@/lib/hooks";

const ISOS = [100, 200, 400, 800, 1600];
type When = "now" | "+2h" | "golden" | "tonight";

/** Where to shoot today, ranked against the time and the actual weather. */
export default function ShootSuggestions({ limit = 3, full = false }: { limit?: number; full?: boolean }) {
  const now = useNow();
  const [fc, setFc] = useState<Forecast | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [when, setWhen] = useState<When>("now");
  const [iso, setIso] = useState(400);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setFc(cachedForecast());
    try { const v = +(localStorage.getItem("ft-iso") || 0); if (ISOS.includes(v)) setIso(v); } catch {}
    getForecast(nyc.lat, nyc.lon, nyc.tz).then(setFc).catch((e) => setErr((e as Error).message));
  }, []);
  const pickIso = (v: number) => { setIso(v); try { localStorage.setItem("ft-iso", String(v)); } catch {} };

  const sun = fc && Math.abs(fc.sunrise - now) < 30 * 3600_000 ? { sunrise: fc.sunrise, sunset: fc.sunset } : roughSun(new Date(now));
  const t = when === "now" ? now : when === "+2h" ? now + 2 * 3600_000 : when === "golden" ? sun.sunset - 40 * 60_000 : sun.sunset + 20 * 60_000;
  const wx = fc ? at(fc, t) : null;
  const sky: Sky = wx ? skyFromCode(wx.code, wx.cloud) : "cloud";
  const light = lightAt(t, sun.sunrise, sun.sunset);
  const d = new Date(t);
  const ranked = useMemo(() => rankSpots(nyc.spots, { light, sky, tempF: wx?.tempF, day: d.getDay(), month: d.getMonth() + 1, date: d.toLocaleDateString("en-CA") }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [light, sky, wx?.tempF, d.getDay(), d.getMonth()]);
  const list = ranked.slice(0, limit);
  const expo = sunny16(sky, light, iso);
  const fmt = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const past = (w: When) => (w === "golden" && now > sun.sunset - 40 * 60_000) || (w === "tonight" && now > sun.sunset + 3 * 3600_000);

  return (
    <section className={`shoots${full ? " full" : ""}`} aria-label="today's shoots">
      <div className="shoots-head">
        <div>
          <h2 className="display">{full ? "where to shoot" : "today's shoots"}</h2>
          <p className="muted shoots-wx">
            {wx ? <>{Math.round(wx.tempF)}°F, {SKY_WORDS[sky]}, {LIGHT_WORDS[light]}</> : err ? <>no forecast ({err}), going by the clock: {LIGHT_WORDS[light]}</> : <>checking the sky…</>}
            {" · "}sunset {fmt(sun.sunset)}
          </p>
        </div>
        {!full && <Link href="/shoots/" className="btn ghost">all spots</Link>}
      </div>

      <div className="shoots-when" role="radiogroup" aria-label="when">
        {(["now", "+2h", "golden", "tonight"] as When[]).filter((w) => !past(w)).map((w) => (
          <button key={w} role="radio" aria-checked={when === w} className={`chip${when === w ? " live" : ""}`} onClick={() => setWhen(w)}>
            {w === "now" ? "now" : w === "+2h" ? "in 2 hours" : w === "golden" ? `golden hour, ${fmt(sun.sunset - 60 * 60_000)}` : `blue hour, ${fmt(sun.sunset + 5 * 60_000)}`}
          </button>
        ))}
      </div>

      <div className="shoots-expo brushed">
        <span className="muted">your film</span>
        <span className="shoots-isos">{ISOS.map((v) => <button key={v} className={`chip${iso === v ? " live" : ""}`} onClick={() => pickIso(v)} aria-pressed={iso === v}>{v}</button>)}</span>
        <span className="shoots-reading">{expo ? <><b>f/{expo.f} at 1/{expo.speed}</b> <span className="muted">{expo.note}</span></> : <><b>meter it</b> <span className="muted">too dark for sunny 16: brace, open up, bracket. Try pushing your {iso >= 400 ? iso : 400} film a stop.</span></>}</span>
      </div>

      <ol className="shoots-list">
        {list.map(({ spot, reasons }, i) => {
          const node = spot.node ? pack.nodes.find((n) => n.id === spot.node) : null;
          const isOpen = open === spot.id || (full && i < 1 && open === null);
          return (
            <motion.li key={spot.id} className="shoot paper" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05 }}>
              <button className="shoot-top" onClick={() => setOpen(isOpen ? "" : spot.id)} aria-expanded={isOpen}>
                <span className="shoot-n display">{i + 1}</span>
                <span className="shoot-main">
                  <span className="shoot-line">shoot <b>{spot.subject}</b> at {spot.name}</span>
                  <span className="muted shoot-why">{spot.area}{reasons.length ? ` · ${reasons.slice(0, 2).join(", ")}` : ""}</span>
                </span>
              </button>
              {isOpen && (
                <div className="shoot-body">
                  <p>{spot.brief}</p>
                  <p className="shoot-tech"><span className="muted">technique</span> {spot.technique}</p>
                  <div className="shoot-links">
                    <a className="chip" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.map)}`} target="_blank" rel="noreferrer">map</a>
                    {node && <Link className="chip" href={`/frame/${node.id}/`}>lesson: {node.title}</Link>}
                    <Link className="chip" href={`/log/?new=1`}>log the roll</Link>
                  </div>
                </div>
              )}
            </motion.li>
          );
        })}
      </ol>
      {full && <p className="muted">Weather from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>, free and keyless. Only a fixed point in Manhattan is sent, never your location.</p>}
    </section>
  );
}
