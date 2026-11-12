# film tutor — design pass 1

The board met three times: once to brainstorm, once to critique, once to verify. Record of who said what, what was cut, and what got built.

## The board

| seat | who (roleplayed) | lens |
|---|---|---|
| **the teacher** | a darkroom instructor who has taught intro film for 20 years | what a beginner actually trips over, in what order |
| **the learning scientist** | cognitive psychologist, retrieval practice and spacing | will it *stick*, or just feel good |
| **the game designer** | designed progression systems for two indie RPGs | motivation, pacing, unlock tension, "one more frame" |
| **the interaction designer** | built Haze | does it feel like Haze — material, motion, mood |
| **the critic** | photo historian and curator, writes exhibition texts | the canon, photobooks, how to *talk* about pictures |
| **the engineer** | static-site and offline-first nerd | $0 forever, sync, no tokens, survives years |

---

## round 1 — brainstorm

**the game designer:** The core metaphor writes itself. **XP is frames. A level is a roll.** You "expose frames" by learning; when a roll fills, it gets *developed*, and that's the level-up ceremony. Rolls get longer as you go (24 → 36 → bulk-loaded 72), like a real level curve. Each level carries a rank title in the voice of the craft: *latent image, first roll, contact sheet, work print, fibre print, exhibition print, monograph*.

**the interaction designer:** Then the skill tree is a **contact sheet**. Each branch is a strip of negatives with sprocket holes, and each skill is a frame. Locked frames are unexposed, near-black film base. Available ones have a *latent* glow in signal blue, meaning something is there but not developed yet. Learned frames are developed prints, and mastered frames get the grease-pencil circle a photographer draws around a keeper. You read the whole tree the way you read a real contact sheet.

**the teacher:** The order matters more than the art. Beginners die on three things: (1) not understanding that aperture, shutter and ISO are all the *same unit*, stops; (2) not trusting the meter, or trusting it blindly; (3) loading film wrong and losing a whole roll. Roll loading needs to be one of the very first frames. And the owner has a **K1000**: match-needle meter, center-weighted, battery only runs the meter, mechanical shutter 1–1/1000 + B, flash sync at 1/60. Teach on that body.

**the learning scientist:** Reading isn't learning. Every lesson needs (a) a retrieval check before you're allowed to call it done, and (b) cards that enter a spaced-review queue. Mastery should mean *you still remember it three weeks later*, not that you clicked "complete". So: **learned = passed the proof (quiz ≥ 80%)**, and **mastered = every card for that frame has reached a 21-day interval**. And interleave the review queue so it isn't ten aperture cards in a row.

**the critic:** Give the canon its own room. There are two kinds of study here: *who and what* (photographers, photobooks) and *how to speak* (critique). For critique, use a real method. Feldman's four steps (describe, analyze, interpret, judge) for structure, plus Barthes' *studium/punctum*, Szarkowski's five qualities from *The Photographer's Eye* (the thing itself, the detail, the frame, time, vantage point) and Shore's three levels from *The Nature of Photographs*. The owner writes a reading, *then* sees a model reading and scores themselves against a rubric. Writing first, revealing second.

**the engineer:** Constraints: a static export on GitHub Pages and no server. Progress lives in IndexedDB. Sync goes through a private GitHub Gist with a gist-only token. To make sync merge cleanly, XP should be an **append-only event log** (frames earned), merged as a union by event id, with no lost-update problem. Everything else is a record with `updatedAt`, last-write-wins. A service worker gives offline use. No images of other people's photographs ship in the app (copyright); we link out to image searches.

**the game designer:** Sessions. The user asked to *choose* what to study each session. So the home screen has **"load today's roll"**: pick up to three available frames, plus whatever reviews are due, and the session runs through them. That gives the choice and the structure together.

**the teacher:** Field gates. Some frames shouldn't unlock from reading alone. You can't move past "metering in the real world" until you've **logged a real roll**. That's the bridge from theory to the K1000 in your hands.

**the interaction designer:** Tools, not just text. An **exposure simulator** with a K1000 needle: pick a scene, turn aperture/shutter/ISO, watch the needle and a rendered frame (brightness, depth-of-field blur, motion blur, grain). A **sunny 16 drill**: a sky condition flashes, you dial the exposure, and it gets scored in stops of error. Those two make the fundamentals *physical*.

**the critic:** And a glossary deck, "speaking photography": the vocabulary itself becomes review cards (tonality, acutance, vantage, picture plane, punctum, sequencing...).

---

## round 2 — critique

**the learning scientist → the game designer:** XP for *reading* will get farmed. Only award frames for evidence of learning: passing a proof, a review graded "good" or better, logging a roll, completing a critique. A *re*-read earns nothing. **accepted.**

**the engineer → the interaction designer:** A full-screen WebGL shader plus a canvas cursor layer plus framer-motion parallax on a mid-range phone is a battery fire. **resolved:** cap the shader at ~30fps and a resolution scale of ≤ 0.75, pause it when the tab is hidden, turn off the cursor halo on touch devices, and make every motion respect `prefers-reduced-motion`.

**the teacher → the critic:** Don't front-load theory. Barthes before you've shot a roll is noise. **resolved:** critique branch frame 1 ("describe what you see") is available early, and the theory frames (studium/punctum, Shore's levels) require the composition basics *and* a level threshold.

**the interaction designer → the game designer:** A tree with lines crossing everywhere looks like a corporate org chart, not Haze. **resolved:** no drawn prerequisite lines. The contact sheet shows strips; tapping a locked frame opens a sheet that says *"develops after: x, y"*, and those names are tappable. Phone first: strips scroll sideways.

**the critic → everyone:** Shipping copyrighted photographs is out, and so are fake image URLs. **resolved:** each critique subject and each photographer carries an image-search link built from title and author. The owner opens it, looks, comes back and writes.

**the learning scientist → the teacher:** Quizzes must explain *why* on wrong answers, not just mark red. **accepted:** every question has an explanation.

**the game designer → the engineer:** Without streaks there's no daily pull. **partially accepted:** a gentle "days at the bench" counter with no punishment for missing a day, because guilt mechanics kill hobbies.

**the interaction designer → the engineer:** Frosted glass on top of a canvas shader can stutter on iOS. **resolved:** use glass only on sheets and the dock. Sections use their own lighter materials: fibre paper, film base, brushed plate.

**the engineer → the game designer:** Expansion. Ranks, the level-curve flavour and the XP unit name ("frames") are film-specific. **resolved:** the engine takes `ranks` and `unit` from the subject pack. A videography pack could call XP "takes" and levels "reels".

---

## round 3 — verification (what we ship in pass 1)

- [x] engine/content split: `src/engine` knows nothing about film; `content/film` is a typed data pack validated at build (unknown prereqs and cycles fail the build)
- [x] XP = frames, level = roll, curve 24 / 30 / 36 … capped at 72, ranks from the pack
- [x] statuses: locked → latent → learned (proof ≥ 80%) → mastered (all cards ≥ 21d)
- [x] unlock rules: prereqs learned + optional min level + optional field gate (logged rolls)
- [x] SM-2-style review with again/hard/good/easy, interleaved by branch
- [x] home "field": chrome title, roll canister HUD, load-today's-roll session builder, darkroom (due count), recent log, a library pick, days at the bench
- [x] contact sheet tree, node sheet, lesson → proof → develop ceremony → new frames
- [x] exposure simulator with K1000 needle; sunny 16 drill
- [x] field log (rolls as negative sleeves), assignment linking, self-review checklist, links to scans only
- [x] library: photographers + photobooks with study prompts, "studied" marks and personal notes
- [x] the loupe: guided critique (Feldman steps + formal elements), model reading reveal, rubric self-score
- [x] gist sync with union/LWW merge, export/import JSON, offline service worker, installable
- [x] reduced motion, phone-first, keyboard focus states

### layout

```
 [chrome "film tutor", warping]                     (roll canister · 14/30)
   load today's roll ───────────────────────────────
     [frame] [frame] [frame]  + 6 reviews   (begin)
                                   ┌ darkroom tray ┐
                                   │ 6 due · 2 new │
   [field log: negative sleeves]   └───────────────┘
                          [library: a print, pinned, slightly tilted]
       [contact sheet preview strip, sideways]
                     ( days at the bench · 4 )
 ─────────── frosted dock: field · sheet · darkroom · log · library · loupe ───────────
```

### still open for pass 2
- More content depth per branch (the pack is designed to grow without code changes)
- Zone system visualizer, a development-time calculator, push/pull chart tool
- Second subject pack to prove the engine is generic
