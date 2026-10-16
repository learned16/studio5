# EX-001 — Arabic names for the official weekly syllabus topics

status: open
owner: executor
base: claude/zen-bell-oqcqtr
branch: exec/EX-001-syllabus-ar
roadmap: COLLEGE_PLAN §9 week 1 · syllabus: all Year-1 modules (docs/SYLLABUS_ARCH_Y1.md "Weekly syllabus")

## Goal
The subject page shows the department's weekly topics in English (as written in the course descriptions). The student
reads Arabic first, so give every topic an accurate Arabic name the way an Iraqi engineering lecturer would say it,
shown under the English line when the app is in Arabic.

## Read first
- src/college/05-syllabus.js — `S5.SYLLABUS` (subject English name → `[[week, "topic"], …]`) and how `S5.SYLLABUS_AR`
  is read (`arT`): same keys, same order, same week numbers.
- docs/SYLLABUS_ARCH_Y1.md — the original tables.

## Allowed files
- src/college/06-syllabus-ar.js (new) — one IIFE: `(() => { S5.SYLLABUS_AR = { … }; })();`
- tests/col-ex-001-syllabus-ar.mjs (new)

## Do not touch
src/college/05-syllabus.js and every other file. Do not change the English topics.

## Acceptance criteria
- [ ] Every subject key in `S5.SYLLABUS` has an entry in `S5.SYLLABUS_AR` with the same length and the same week numbers.
- [ ] Standard Iraqi technical Arabic; keep math symbols (sin θ / θ, y′, y″) as they are; English technical term in
      brackets only where the Arabic is uncommon, e.g. "قاعدة كرامر (Cramer)".
- [ ] Obvious typos in the source ("iirregular") are translated by meaning, not copied.
- [ ] `node build.mjs` succeeds. (On review Claude checks that the Calculus subject page in Arabic shows an Arabic line under each of the 16 topics.)

## Test
`tests/col-ex-001-syllabus-ar.mjs` — a plain node test, no browser: read `src/college/05-syllabus.js` and
`src/college/06-syllabus-ar.js` with `node:fs`, run both with `node:vm` in a context
`{ S5: { act: {} }, document: { addEventListener() {} } }` (05 first), then assert for every key of `S5.SYLLABUS`:
`S5.SYLLABUS_AR` has the same key, the same length and the same week numbers in the same order, and every Arabic
string contains Arabic letters (/[\u0600-\u06FF]/) and is not empty. `process.exitCode = 1` on any failure. Run it with
`node tests/col-ex-001-syllabus-ar.mjs` from `studio5-app/`. (Claude checks the screen in Arabic on review.)

## Executor report

## Lead review
