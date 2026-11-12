// Exposure arithmetic shared by the widgets.
export const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
export const SHUTTERS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000];
export const ISOS = [100, 200, 400, 800, 1600, 3200];

export const shutterLabel = (t: number) => (t >= 1 ? `${t}s` : `1/${Math.round(1 / t)}`);
export const fLabel = (n: number) => `f/${n}`;

/** EV of a camera setting (at the film's ISO). */
export const settingEv = (n: number, t: number) => Math.log2((n * n) / t);
/** EV a scene needs at a given ISO, from its ISO-100 light value. */
export const sceneEvAt = (ev100: number, iso: number) => ev100 + Math.log2(iso / 100);
/** Positive = overexposed by that many stops. Nominal f-numbers make ±0.2 noise, so round to thirds. */
export const errorStops = (ev100: number, iso: number, n: number, t: number) =>
  Math.round((sceneEvAt(ev100, iso) - settingEv(n, t)) * 3) / 3;
