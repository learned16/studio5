# EX-001 — Arabic names for the official weekly syllabus topics

status: in-progress (executor)
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
- [x] Every subject key in `S5.SYLLABUS` has an entry in `S5.SYLLABUS_AR` with the same length and the same week numbers.
- [x] Standard Iraqi technical Arabic; keep math symbols (sin θ / θ, y′, y″) as they are; English technical term in
      brackets only where the Arabic is uncommon, e.g. "قاعدة كرامر (Cramer)".
- [x] Obvious typos in the source ("iirregular") are translated by meaning, not copied.
- [x] `node build.mjs` succeeds. (On review Claude checks that the Calculus subject page in Arabic shows an Arabic line under each of the 16 topics.)

## Test
`tests/col-ex-001-syllabus-ar.mjs` — a plain node test, no browser: read `src/college/05-syllabus.js` and
`src/college/06-syllabus-ar.js` with `node:fs`, run both with `node:vm` in a context
`{ S5: { act: {} }, document: { addEventListener() {} } }` (05 first), then assert for every key of `S5.SYLLABUS`:
`S5.SYLLABUS_AR` has the same key, the same length and the same week numbers in the same order, and every Arabic
string contains Arabic letters (/[\u0600-\u06FF]/) and is not empty. `process.exitCode = 1` on any failure. Run it with
`node tests/col-ex-001-syllabus-ar.mjs` from `studio5-app/`. (Claude checks the screen in Arabic on review.)

## Executor report

- Added Arabic names in `src/college/06-syllabus-ar.js` for all 157 topics across the 10 subject keys, preserving each week number and order. The file is marked `needs-check` until lead review.
- Added `tests/col-ex-001-syllabus-ar.mjs` to execute both syllabus modules in a VM and check subject keys, topic counts, week alignment, and Arabic text.
- Validation on Node v22.22.0: `node tests/col-ex-001-syllabus-ar.mjs` PASS (10 subjects, 157 topics); `node build.mjs` PASS (977 KB app, 410 lessons). Confirmed the generated HTML includes the new translations; generated `dist/` and `public/` files are not part of this branch diff.
- Terminology that may need lead confirmation: “missing third view” for the source's “deleted third position,” and “Thermstone” retained as the material's product name.
- Delivery: commit `13d2e7c` is pushed to `origin/exec/EX-001-syllabus-ar`. Draft PR creation is blocked: both `gh pr create` and the GitHub REST API return HTTP 403 (`Forbidden`). GitHub's suggested PR page is `https://github.com/learned16/studio5/pull/new/exec/EX-001-syllabus-ar`; set the base to `claude/zen-bell-oqcqtr`.

## Lead review
