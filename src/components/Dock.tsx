"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { dueQueue } from "@/engine/progress";
import { defaultPack } from "@/lib/packs";
import { useNow } from "@/lib/hooks";

const items = [
  { href: "/", label: "field", icon: "M3 13c3-5 6-7 9-7s6 2 9 7M5 17h14" },
  { href: "/sheet/", label: "sheet", icon: "M3 6h18v12H3zM3 9h18M3 15h18M7 6v12M12 6v12M17 6v12" },
  { href: "/darkroom/", label: "darkroom", icon: "M4 15h16l-2 4H6zM8 15V9a4 4 0 018 0v6" },
  { href: "/log/", label: "log", icon: "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h3" },
  { href: "/prints/", label: "prints", icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15.5 8.5h.01" },
  { href: "/library/", label: "library", icon: "M5 4v16M9 4v16M13 5l4 15M19 4v16" },
  { href: "/loupe/", label: "loupe", icon: "M10 4a6 6 0 110 12 6 6 0 010-12zM14.5 14.5L20 20" },
];

export default function Dock() {
  const path = usePathname() || "/";
  const { p } = useStore();
  const now = useNow();
  const due = dueQueue(defaultPack, p, now).length;
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h.replace(/\/$/, "")));
  return (
    <nav className="dock glass" aria-label="sections">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={`dock-item${active(it.href) ? " on" : ""}`} data-magnet aria-current={active(it.href) ? "page" : undefined}>
          {active(it.href) && <motion.span layoutId="dock-on" className="dock-glow" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={it.icon} /></svg>
          <span>{it.label}</span>
          {it.label === "darkroom" && due > 0 && <i className="dock-due" aria-label={`${due} due`}>{due > 99 ? "99+" : due}</i>}
        </Link>
      ))}
    </nav>
  );
}
