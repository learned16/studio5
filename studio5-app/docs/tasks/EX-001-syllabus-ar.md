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
- [ ] In Arabic, the Calculus subject page shows an Arabic line under each of the 16 topics; no page errors.

## Test
`tests/col-ex-001-syllabus-ar.mjs` — loads BASE, asserts shape equality for every subject (keys, lengths, weeks),
every Arabic string contains Arabic letters, and with lang "ar" the Calculus subject page renders 16 `.syl-list li .ar`.
Copy the harness from tests/col-syllabus.mjs.

## Executor report

## Lead review
