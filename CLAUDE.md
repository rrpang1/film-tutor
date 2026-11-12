# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Film Tutor** is a personal, game-like learning app for film photography: a skill tree with prerequisites, XP and levels, spaced review, a field log, a library and critique practice. Hard constraints from the owner:

- **$0 and no tokens, forever.** It's a fully static PWA (Next.js `output: "export"`), hosted on GitHub Pages and synced through a private GitHub Gist. No server code, no API routes, no runtime LLM calls. All lesson content is authored into the repo.
- **Beginner with a Pentax K1000** (manual, match-needle centre-weighted meter, 1–1/1000 + B, sync 1/60, no DoF preview). Pitch content from zero and use the K1000 in examples (`k1000(...)` tips).
- **Subject-agnostic engine.** Film is the first pack; videography, school courses and exams should be addable as new packs with no engine changes.
- **Phone-first**, and it must feel like the owner's Haze dashboard (`D:\claude\Dashboard`).

## Commands

```bash
npm run dev                              # http://localhost:3344
npm test                                 # vitest: engine + pack validation
npx vitest run src/engine/engine.test.ts -t "merge"   # one test
npm run typecheck                        # tsc --noEmit
npm run build                            # next build → out/, then scripts/postbuild.mjs writes out/sw.js
npm run serve                            # serve out/ on :3345 (test the real PWA/offline build here)
```

`.claude/launch.json` defines `film-tutor-dev` (3344) and `film-tutor-static` (3345). Deploy is `.github/workflows/deploy.yml` (push to main → Pages, with `NEXT_PUBLIC_BASE_PATH=/<repo>`).

## Architecture

**Engine (`src/engine/`), pure TS with no React and no film knowledge.** `types.ts` defines `SubjectPack` (branches, nodes, ranks, library, critiques, glossary) and `Progress`. `graph.ts` handles statuses (`locked → latent → learned → mastered`), unlock rules (prereqs + optional `gate: {level, logs, critiques}`), cycle checks and `wouldUnlock`. `xp.ts`: a level is a "roll" of 24, 30, 36… capped at 72. `srs.ts`: SM-2 with four grades, `MASTERED_DAYS = 21`. `progress.ts` covers every state transition (`recordProof`, `gradeCard`, `award`, `enroll`). `merge.ts` is the sync merge. `pack.ts` is the zod schema plus referential checks and `KNOWN_WIDGETS`.

**Content (`content/<subject>/`).** A pack is plain TS using helpers in `content/film/h.ts` (`p`, `ul`, `tip`, `k1000`, `widget`, `quiz(ns, choice/tf/num…)`, `cards(ns, …)`). Ids are namespaced per node and must be globally unique. Register packs in `src/lib/packs.ts`. `src/engine/pack.test.ts` validates every registered pack: schema, unknown prereqs/branches/widgets, duplicate ids, and that **every node is reachable**. Run `npm test` after any content edit. Library and critique entries appear via `unlockedBy: <nodeId>`.

**Rules the engine relies on:**
- XP is an append-only event log with deterministic ids (`learn:<node>`, `rev:<card>:<date>`, `log:<id>`, `lib:<id>`, `crit:<id>`). `award()` ignores duplicate ids, which is what makes re-passing worthless and makes merging safe. Never mutate or remove XP events.
- Every other record carries `updatedAt` and merges last-write-wins. Deletes are tombstones (`deleted: true`). Bump `SCHEMA` and extend `migrate()` when `Progress` changes shape; old gists must keep loading.
- Achievements are derived, never stored.

**App (`src/app`, `src/components`, `src/lib`).** Everything is a client component inside `Shell` → `StoreProvider` (`src/lib/store.tsx`), which loads progress from IndexedDB (`lib/db.ts`), persists on every `update()`, debounces gist sync (`lib/gist.ts`), queues ceremonies (develop and level-up) and detects level-ups. Routes: `/` field (home and today's-roll picker), `/sheet` contact-sheet tree, `/frame/[id]` lesson → proof → develop (`generateStaticParams` from the pack), `/darkroom` review, `/log` field log, `/library`, `/loupe` critique, `/bench` sync and backups. "Today's roll" is per-device localStorage (`lib/session.ts`). Read query params from `location.search` in effects, not `useSearchParams` (static export).

**Widgets** (`src/components/widgets/`) are lesson-embeddable tools (exposure simulator with a K1000 needle, sunny 16 drill, stop ladder, zone scale, DoF, thirds). To add one: build it, map its name in `widgets/index.tsx` **and** add the name to `KNOWN_WIDGETS` in `engine/pack.ts`.

## Design language

Follow Haze's feel (`docs/design-pass-1.md` holds the full rationale). Tokens are in `src/styles/tokens.css`, materials in `src/styles/materials.css` (`.glass` for sheets and the dock, `.paper` for lessons and prints, `.brushed` for tools, `.filmbase` for the contact sheet and canister: the one dark material, `.chrome`). The world layer (`components/world/`: shader haze, cursor halo and click ring, light source) is ported from Haze. Unbounded 200–300 for display only, Manrope for reading, lowercase UI, signal blue `#7fa9d4` as the only "live" colour. Sections float via `components/Float.tsx` (parallax, tilt, focus pull). Respect `prefers-reduced-motion`. Avoid `whileInView` inside horizontally scrolling strips (it misfires). Check 375px width for horizontal overflow.

## Working conventions

- Big design or feature passes go through a roleplayed **board of advisors** (teacher, learning scientist, game designer, interaction designer, critic, engineer): brainstorm, then critique, then verification. Record it as `docs/design-pass-N.md` plus a verification doc.
- No copyrighted images in the repo. Link out to image searches.
- Content accuracy matters: the owner is learning from it. Don't invent works, dates or URLs.
