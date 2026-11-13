import { describe, expect, it } from "vitest";
import { lightAt, nearestSpeed, rankSpots, skyFromCode, sunny16 } from "./shoots";
import { nyc } from "@content/film/city-nyc";
import { packs } from "@/lib/packs";

const H = 3600_000, rise = 7 * H, set = 17 * H;
describe("shoots", () => {
  it("reads the light", () => {
    expect(lightAt(rise + 0.5 * H, rise, set)).toBe("golden-am");
    expect(lightAt(12 * H, rise, set)).toBe("day");
    expect(lightAt(set - 0.5 * H, rise, set)).toBe("golden-pm");
    expect(lightAt(set + 0.3 * H, rise, set)).toBe("blue");
    expect(lightAt(22 * H, rise, set)).toBe("night");
  });
  it("maps weather codes", () => {
    expect(skyFromCode(0)).toBe("clear"); expect(skyFromCode(3)).toBe("overcast");
    expect(skyFromCode(45)).toBe("fog"); expect(skyFromCode(63)).toBe("rain"); expect(skyFromCode(73)).toBe("snow");
  });
  it("puts indoor spots first in the rain at night", () => {
    const r = rankSpots(nyc.spots, { light: "night", sky: "rain", tempF: 40, day: 2, month: 11, date: "2026-11-10" });
    expect(r[0].spot.indoor || r[0].spot.sky.includes("rain")).toBe(true);
    expect(r.slice(0, 3).every((x) => x.spot.light.includes("night"))).toBe(true);
  });
  it("respects market days and seasons", () => {
    const sun = rankSpots(nyc.spots, { light: "day", sky: "clear", day: 0, month: 7, date: "2026-07-05" });
    expect(sun.some((x) => x.spot.id === "union-market")).toBe(false);
    expect(sun.some((x) => x.spot.id === "rink")).toBe(false);
  });
  it("gives sunny 16 on K1000 speeds", () => {
    expect(sunny16("clear", "day", 400)).toMatchObject({ f: 16, speed: 500 });
    expect(sunny16("overcast", "day", 100)).toMatchObject({ f: 8, speed: 125 });
    expect(sunny16("clear", "night", 400)).toBeNull();
    expect(nearestSpeed(1600)).toBe(1000);
  });
  it("links every spot to a real lesson, with unique ids", () => {
    const ids = new Set(packs.film.nodes.map((n) => n.id));
    for (const s of nyc.spots) if (s.node) expect(ids.has(s.node), s.id).toBe(true);
    expect(new Set(nyc.spots.map((s) => s.id)).size).toBe(nyc.spots.length);
  });
});
