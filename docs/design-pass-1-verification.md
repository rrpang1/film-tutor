# film tutor — pass 1, verification round

The same board, reconvened after the first build ran in the browser. Each seat checked its own promises from [design-pass-1.md](design-pass-1.md) against the running app.

## what each seat checked

**the teacher.** Walked the first hour as a beginner. "How film works" and "your k1000" are latent on day one, and loading is gated behind the K1000 tour, which is the right order. The roll-loading lesson names the rewind-knob check explicitly, and the first metered roll is a real field assignment. *Verified.*
- **flag:** "latitude" is gated on one logged roll. That's correct pedagogically, but a beginner who doesn't log will stall in the light branch. **Fix:** the locked frame page links straight to "log a roll", and the home page's empty log card says why logging matters.

**the learning scientist.** A proof of 80% or more develops a frame. Retakes earn nothing (covered by tests). Cards enrol on first pass, the queue interleaves branches, and "mastered" means every card is at a 21-day interval or longer. Wrong answers always show the *why*. *Verified.*
- **flag:** reviews earn 1 frame per card per day. That's enough to reward showing up without becoming a farm. Keep watching it.

**the game designer.** Saw the develop ceremony (the print rising from black in the tray, then the unlocked frames listed as live chips) and the level-up (the canister spins and the rank resolves out of blur). Today's-roll selection works and carries into the frame page as "next in today's roll". *Verified.*
- **changed:** the rank line for roll 2 said "you've loaded, shot, and rewound", which isn't true if you level from lessons alone. Now: "the first frames are in the can."

**the interaction designer.** The haze shader, grain, cursor halo, click ring and magnetic dock come from Haze. Sections float with parallax and a focus pull. The contact sheet is the one dark material in a pale world, as planned. *Verified, with fixes:*
- the selected value's chrome pill on the dials wasn't visible (a CSS specificity clash). **Fixed.**
- contact-sheet and library frames used in-view reveals that misfire inside horizontally scrolling strips. **Replaced** with a load stagger.
- dial tracks overflowed at 375px width. **Fixed** (`min-width: 0`). Page headers now wrap on phones.

**the critic.** Ten critique subjects with full model readings, 26 photographers, 20 books and texts, and a 28-term vocabulary deck. No images ship; every work links to an image search. The loupe makes you write all four Feldman steps (8 or more words each) *before* the model reading appears, then asks you to rate yourself against it. *Verified.*

**the engineer.** A static export of 61 lesson pages plus 7 app pages. The service worker precaches all 103 files (checked in the browser: all cached, no console errors on the production build). Merge is a union for XP and last-write-wins by `updatedAt` for records, idempotent on itself (tested). The pack validator fails the build on unknown prereqs, cycles, duplicate ids or unknown widgets, and checks that every node is reachable. *Verified.*
- **not verified here:** gist sync against real GitHub (it needs the owner's token) and installing on iOS/Android/Mac. Both need the owner's devices.

## open for pass 2
- more drills: a zone-system placement game for real scenes, a push/pull development-time calculator, a "read this negative" density trainer
- a second subject pack (videography is the obvious one) to prove the engine is generic in practice
- an optional "exam" mode: a timed mixed proof across a whole branch, to mark a branch complete
- more photographers and critique subjects as the history branch deepens
