# film tutor — pass 2: the digital darkroom, the city, the wall

The owner asked for five things: (1) take out the cursor glow, (2) a full photo-editing section from basic to advanced Lightroom Classic, colour theory, colour grading and black-and-white editing, (3) a component that suggests today's shoots around the city from the time and weather, (4) a place to show and filter their own photos, and (5) a private, free app on phone, Mac and Windows that syncs without tokens or money.

The same board met: the teacher, the learning scientist, the game designer, the interaction designer, the critic and the engineer. Brainstorm first, then critique, then decisions.

## 1. the cursor glow

**interaction designer:** There were three cursor-tracking lights, not one: the halo canvas, the shader's light pool (it eased toward the pointer) and the `--mx/--my` sheen on paper, chrome and prints. All three read as "a glow that follows me". Remove all three, leave the light fixed where it rests (upper left, like a window). Keep the click ring, the typing sparks and the magnetic dock: those respond to an action instead of following you around.

**decision:** halo removed from `Touch.tsx`, shader light pinned, `LightSource.tsx` deleted. The `--mx/--my` tokens stay at their fixed defaults.

## 2. photo editing

### brainstorm

**teacher:** The owner shoots film, so editing starts at the *scan*, not the camera file. They need: what a scan is (lab JPEG versus TIFF, bit depth), the Lightroom Classic mental model (catalog, non-destructive), culling, the Basic panel in order, the histogram, curves, masks, cleanup, B&W, consistency across a roll, export. Then colour as its own discipline: what colour *is*, white balance, harmony, the HSL mixer, the Color Grading panel, film looks, colour management.

**learning scientist:** Editing is procedural knowledge. Reading about sliders won't stick; *moving* them will. Every major lesson needs a hands-on widget where the owner can drag the real controls and watch a histogram respond. And let them load one of their own scans into it, since transfer is best on your own material. Cards should test *which control fixes which problem* ("skies blown out, everything else fine → highlights or a sky mask"), not slider trivia.

**game designer:** Two new branches make a natural pair on the contact sheet: **the digital darkroom** (Lightroom workflow and B&W) and **colour** (theory into grading). Gate the capstones on field logs, as before: you can't learn to edit a roll you haven't shot. The capstone is "edit a whole roll to one look", logged as an assignment.

**critic:** Teach restraint as a skill, explicitly. The most common failure in edited film scans is fighting the stock: crushing Portra into teal-and-orange, adding fake grain to real grain. One lesson should be about *when to stop* and how to judge an edit (the walk-away test, the before/after toggle, the second look on another screen). Link colour to the canon the library already holds (Eggleston, Leiter, Shore) and add two real colour books: Albers' *Interaction of Color* and Itten's *The Art of Color*.

**engineer:** Lightroom Classic is paid software, and the app's rule is $0 for the *app*, not for the owner's other tools. But every LR lesson should name a free equivalent (darktable, RawTherapee, Lightroom mobile's free tier, Snapseed) so nothing is locked behind a subscription. Keyboard shortcuts must be accurate. Only include ones we're sure of, and name the version only where it's well documented (Color Grading replaced Split Toning in LR Classic 10, Oct 2020; AI masks arrived in LR Classic 11, Oct 2021).

### critique

- **teacher → engineer:** Don't write "Lightroom can invert negatives natively". It can't do it cleanly. Teach the honest routes: the paid Negative Lab Pro plugin, darktable's *negadoctor*, RawTherapee's *film negative* tool, or the manual inverted-curve method, with its catch that every slider then works backwards.
- **learning scientist → game designer:** 23 new frames is a lot. Keep tiers shallow at the start, so the owner can edit their first lab scans after three or four frames, and push the advanced material (range masks, calibration, colour management) to tiers 4–5.
- **critic → teacher:** "film looks" must not invent stock behaviour. Keep to widely documented traits: Portra's warm, forgiving skin; Ektar's saturation; CineStill 800T's red halation (its anti-halation remjet layer is removed); Fuji 400H's pastel greens (discontinued in 2021).

### decisions

- New branches `editing` ("the digital darkroom", 15 frames) and `colour` (8 frames) in the film pack: `content/film/editing.ts` and `content/film/colour.ts`.
- New widget **`develop`**: a small Develop module drawn on a canvas, with a procedurally painted test scene (no copyrighted image) or the owner's own photo loaded locally. Panels: `wb`, `basic`, `curve`, `hsl`, `grade`, `bw`, plus a live RGB/luma histogram, clipping warnings and a before/after hold.
- Two new library books: *Interaction of Color* (Albers, 1963) and *The Art of Color* (Itten, 1961).

## 3. today's shoots

### brainstorm

**teacher:** "Shoot the skateboarders at Tompkins Square Park" is a great prompt because it has a *subject*, a *place* and an implied *technique* (shutter speed for motion). Every suggestion should carry all three, plus a K1000 exposure starting point for the actual weather.

**game designer:** Rank spots by fit: time of day (golden hour, midday, blue hour, night), weather (clear, cloud, rain, snow, fog), day of week (the Union Square Greenmarket runs Mon/Wed/Fri/Sat) and season. Show three on the field page, each with a "why now" line. Tapping one links to the matching lesson (motion, low light, street).

**engineer:** Weather from **Open-Meteo**: free, no account, no API key, CORS-enabled. One request returns current conditions, today's sunrise and sunset, and the next hours' cloud cover. Use a fixed city point (lower Manhattan), so no geolocation is needed and the owner's location is never sent anywhere. Cache the last forecast so it works offline, falling back to time-of-day-only suggestions. The spot list is data (`content/film/city-nyc.ts`) and the ranking is a pure engine function (`src/engine/shoots.ts`) with tests, so another city is just another data file.

**critic:** Only real places, described accurately and modestly. No invented events, no claims about specific dates.

### decision

`ShootSuggestions` on the field page (top three) plus a `/shoots` page with every spot ranked, a "why now" for each, the matching lesson, and a sunny-16 exposure for today's light at the ISO you choose.

## 4. the wall (your photos)

### brainstorm

**interaction designer:** Call it **prints**, a wall of your own frames. The layouts are a masonry wall, contact sheets grouped by roll, and a colour wheel ordering (sort by dominant hue) that's beautiful and also teaches colour. Clicking opens a lightbox with arrow keys and swipe, plus details.

**game designer:** Filters: film stock, camera, roll, tag, colour or B&W, colour family, rating, favourites, year. Most metadata should fill itself in: choose a roll from the log and stock, camera and date come with it. Detect colour versus B&W and the dominant hue from the pixels automatically.

**engineer:** Images go into IndexedDB as blobs: a display copy (long edge 1600 px) and a thumbnail (480 px). Metadata lives in `Progress.photos` (schema v2, migrated) so it merges last-write-wins like everything else. Image bytes sync through **photo shard gists** (about 15 images each), so no single gist response gets huge. Each photo record names its shard, and other devices fetch missing images through the raw gist URL. You can also add by URL (a photo hosted elsewhere).

**critic:** Your own photos next to the lessons is the point: the "develop" widget should be able to open any photo on the wall.

## 5. private, free, everywhere

**engineer:** It's already a static PWA, and that *is* the free, cross-platform app: installable on iPhone (Safari → Share → Add to Home Screen), Mac (Safari → File → Add to Dock, or Chrome/Edge install) and Windows (Edge/Chrome → Install). It needs no app stores, signing fees or servers. Native wrappers (Tauri/Electron) would add unsigned-app warnings on Mac and a build pipeline for no real gain. So:
- an **install** card on the bench, with steps for the device you're on and a one-tap install button where the browser supports it.
- **end-to-end encryption** for sync. A secret gist is unlisted, not private: anyone with its URL can read it. With a passphrase set, progress and photos are encrypted on the device (AES-GCM, PBKDF2-derived key) before upload, so GitHub only ever stores ciphertext. Use the same passphrase on every device. The passphrase never leaves the device.
- the app's *code* is public on GitHub Pages, but it contains no personal data. All of the owner's data is on their devices and (encrypted) in their gists.

**learning scientist:** Nothing here costs tokens or money. Weather comes from a free keyless API, sync uses the owner's own GitHub, and hosting is Pages.

## verification
See [design-pass-2-verification.md](design-pass-2-verification.md).
