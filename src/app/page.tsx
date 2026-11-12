"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Float from "@/components/Float";
import Canister from "@/components/Canister";
import { useStore } from "@/lib/store";
import { defaultPack as pack } from "@/lib/packs";
import { plan } from "@/engine/planner";
import { statuses } from "@/engine/graph";
import { benchDays } from "@/engine/progress";
import { useNow } from "@/lib/hooks";
import { setSession } from "@/lib/session";

export default function Field() {
  const { p, ready } = useStore();
  const now = useNow();
  const router = useRouter();
  const pl = useMemo(() => plan(pack, p, now), [p, now]);
  const st = useMemo(() => statuses(pack, p), [p]);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const picks = chosen ?? pl.suggested.map((n) => n.id);
  const [reviews, setReviews] = useState(true);
  const logs = Object.values(p.logs).filter((l) => !l.deleted).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const unlockedLib = pack.library.filter((e) => !e.unlockedBy || p.nodes[e.unlockedBy]?.learnedAt);
  const pin = unlockedLib.length ? unlockedLib[Math.floor(now / 86_400_000) % unlockedLib.length] : null;
  const toggle = (id: string) => setChosen((c) => {
    const cur = c ?? picks;
    return cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id];
  });
  const begin = () => {
    setSession({ ids: picks, reviews: reviews && pl.due > 0, at: Date.now() });
    router.push(reviews && pl.due > 0 ? "/darkroom/?session=1" : `/frame/${picks[0]}/`);
  };
  const date = new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toLowerCase();
  const first = ready && p.xp.length === 0;

  return (
    <div className="page field">
      <header className="field-head">
        <div>
          <motion.h1 className="display hero chrome-text" initial={{ opacity: 0, filter: "blur(16px)", letterSpacing: "0.12em" }} animate={{ opacity: 1, filter: "blur(0px)", letterSpacing: "-0.03em" }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}>
            film<br />tutor
          </motion.h1>
          <p className="lift field-date">{date}</p>
        </div>
        <div className="field-hud">
          <Canister />
          <Link href="/bench/" className="bench-link" data-magnet aria-label="settings and sync">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
          </Link>
        </div>
      </header>

      {first && (
        <Float speed={0.04} className="welcome paper">
          <p className="display" style={{ fontSize: "var(--t-l)", margin: 0 }}>start anywhere on the left edge of the sheet.</p>
          <p>Every skill is a frame on a contact sheet. Pass a frame's proof to develop it: that earns {pack.unit[1]}, unlocks the frames after it, and puts its cards in the darkroom for review. Fill a roll and it gets developed. That&apos;s a level.</p>
          <p className="muted">Your K1000 is the camera in every example. Start with &ldquo;your k1000&rdquo; and &ldquo;how film works&rdquo;.</p>
        </Float>
      )}

      <Float speed={0.06} tilt={-0.4} className="today">
        <div className="today-head">
          <h2 className="display">load today&apos;s roll</h2>
          <p className="muted">pick up to three latent frames. {pl.latent.length} are ready to develop.</p>
        </div>
        <div className="today-strip filmbase">
          <div className="rebate"><span>today</span><span>{picks.length}/3</span></div>
          <div className="today-frames">
            {pl.latent.slice(0, 9).map((n) => {
              const on = picks.includes(n.id);
              return (
                <motion.button key={n.id} className={`tframe${on ? " on" : ""}`} onClick={() => toggle(n.id)} aria-pressed={on} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                  <span className="tframe-branch">{pack.branches.find((b) => b.id === n.branch)?.title}</span>
                  <span className="tframe-title">{n.title}</span>
                  <span className="tframe-meta">{n.minutes} min, +{n.xp}</span>
                </motion.button>
              );
            })}
            {pl.latent.length === 0 && <p className="tframe-empty">every latent frame is developed. Visit the darkroom, or log a roll to open field-gated frames.</p>}
          </div>
          <div className="rebate bottom"><span>sprockets</span></div>
        </div>
        <div className="today-foot">
          <label className={`chip${reviews && pl.due ? " live" : ""}`}>
            <input type="checkbox" className="sr" checked={reviews} onChange={(e) => setReviews(e.target.checked)} disabled={!pl.due} />
            {pl.due ? `${reviews ? "with" : "without"} ${pl.due} ${pl.due === 1 ? "review" : "reviews"} first` : "no reviews due"}
          </label>
          <button className="btn signal" onClick={begin} disabled={!picks.length} data-magnet>begin</button>
        </div>
      </Float>

      <div className="field-grid">
        <Float speed={0.12} tilt={1.2} className="tray-card">
          <Link href="/darkroom/" className="tray filmbase" data-magnet>
            <span className="tray-glow" style={{ opacity: pl.due ? 1 : 0.25 }} />
            <span className="display tray-n">{pl.due}</span>
            <span>{pl.due === 1 ? "card waiting" : "cards waiting"} in the darkroom</span>
          </Link>
        </Float>

        <Float speed={0.03} tilt={-0.8} className="log-card brushed">
          <div className="card-head"><h2 className="display">field log</h2><Link className="btn ghost" href="/log/?new=1">log a roll</Link></div>
          {logs.length ? (
            <ul className="sleeves">
              {logs.map((l) => (
                <li key={l.id}><Link href={`/log/?open=${l.id}`} className="sleeve"><span className="sleeve-neg" /><span><b>{l.title || l.stock}</b><br /><span className="muted">{l.date}, {l.stock} at {l.iso}</span></span></Link></li>
              ))}
            </ul>
          ) : <p className="muted">nothing logged yet. Some frames won&apos;t develop until you&apos;ve shot a real roll.</p>}
        </Float>

        {pin && (
          <Float speed={0.16} tilt={2.4} className="pin-card">
            <Link href={`/library/?open=${pin.id}`} className="pinned paper" data-magnet>
              <span className="tape" aria-hidden />
              <span className="muted">{pin.kind === "book" ? "from the shelf" : "on the wall today"}</span>
              <span className="display pinned-name">{pin.name}</span>
              <span className="muted">{pin.years}{pin.by ? `, ${pin.by}` : ""}</span>
              <span className="pinned-sum">{pin.summary}</span>
            </Link>
          </Float>
        )}

        <Float speed={0.08} tilt={-0.3} className="mini-sheet">
          <Link href="/sheet/" className="mini filmbase" data-magnet>
            {pack.branches.map((b) => {
              const ns = pack.nodes.filter((n) => n.branch === b.id);
              return (
                <span key={b.id} className="mini-row">
                  <span className="mini-name">{b.title}</span>
                  <span className="mini-frames">{ns.map((n) => <i key={n.id} className={st[n.id]} />)}</span>
                </span>
              );
            })}
            <span className="mini-foot">{pl.learned} of {pack.nodes.length} developed, {pl.mastered} keepers</span>
          </Link>
        </Float>
      </div>

      <Float speed={0.02} className="bench-line">
        <p className="lift">{benchDays(p, now)} {benchDays(p, now) === 1 ? "day" : "days"} at the bench in a row. Missing a day only resets the count.</p>
      </Float>
    </div>
  );
}
