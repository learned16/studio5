# COLLEGE-M3 — Problem room: attempts, fading, mastery chips, campus rooms

## الحالة

`AUTOMATED PASS` (tests/col-m3-pset.mjs, 40+ checks). Builder-verified; independent review still owed.

## الهدف

Make the M2 engine visible (docs/COLLEGE_PLAN.md Appendix M3): unlimited fresh-number statics practice that code
grades exactly, shows the code-made solution, fades the help, and records evidence (`attempt`) that survives backup.

## النطاق والملفات

- `src/college/30-view-pset.js` (new IIFE, attaches only to `S5.pset`, `S5.views.pset`, `S5.act['pset-*']`):
  - view `pset` with `r.kind` `'civil' | 'arch'` and `r.id` = objective id or problem id. Civil shows generators
    whose `program` is `civil` or `both`; Arch shows `arch` or `both` (today: the composite-centroid generator).
  - problem text in the UI language (Arabic first), inside `[data-noi18n]`, with the other language in a `<details>`;
    the generator's SVG; one input (`inputmode=decimal`) + unit picker per field; a sense picker (T/C, CCW/CW) where
    the field has `sense`.
  - Submit → `S5.prob.grade` (per field `S5.grade`) → feedback by structured code in Arabic and English
    (`S5.pset.message(result, field, lang?)`), e.g. "Unit slip: you gave N, asked kN …"; then every step from
    `steps(p)` is shown ("Solution by code"). An item is answered once; "New numbers" draws a fresh seed that was
    never attempted for that generator (`S5.newSeed(avoid)`), so mastery sees distinct seeds.
  - Worked-example fading 0–3: level 0 shows all steps; level L hides `ceil(n·L/3)` steps from the end (backward
    fading: each level hides at least one more step); level 3 shows none. A fully correct answer climbs one level,
    any other result drops one (floor 0). The level is derived from the latest practice attempt of the objective
    (`S5.pset.nextFade(obj)`), so it is never stored separately and survives reload/backup.
  - Tier: levels 0–2 → `E2`; level 3 → `E3` unless the student pressed "Show a step" for that item (then `E2`).
  - Objective chips: one per objective of the room, state from `S5.mastery.of(obj)` (`data-state`).
  - Current item `{pid, v, seed, hints, t0}` in `S5.ls('pset_cur_<obj>')`, the last objective per room in
    `S5.ls('pset_obj_<kind>')` — a reload resumes the same numbers (and the same "step shown" state).
  - Typed answers survive a store `change` (view is LIVE) and a re-render of the view (in-memory draft).
  - Test hook `S5.pset.cur = {kind, obj, pid, v, seed, p, keys, fields, fade, hints, done, tier}`.
  - Registration via hooks only: `S5.CAMPUS_EXTRA` (civil + arch "Problem room"), `S5.LIVE_EXTRA` (`pset`),
    `S5.ROOT_EXTRA` (`pset → practice`).
- `src/tutor.js` lessonHTML: one guarded call `S5.pset.lessonBtn(t, prog)` → a "Graded practice" button on any
  library lesson that a generator maps (`S5.prob.forLesson`), opening the right room (arch lesson → arch room).
- `src/view-practice.js`: one guarded call `S5.pset.cardHTML()` → a "Problem sets" card (civil / architecture).
- `src/i18n-ar-m3.txt`: Arabic for every new UI string.
- `tests/col-m3-pset.mjs` (new); `tests/ar.mjs`: the two pset routes added to the route list.

## السجلات (Data)

- One `attempt` record per submit (never per keystroke), built by `S5.prob.record`:
  `{pid, v, seed, obj, lesson, given:{k:[num, unit, sense?]}, codes:{k:code}, score, tier, mode:'practice', fade, ms, hints, kind}`.
  `hints` and `kind` are additive fields. Params are not stored (`pid + v + seed` reproduces them).
- No schema change, no migration. Old data and old backups are untouched; backups carry attempts as ordinary records.
- Recovery: deleting `src/college/30-view-pset.js` removes the room; the two guarded calls render nothing, and
  attempt records stay harmlessly in the store.

## خارج النطاق / مؤجل

- The optional ink scratch pad (`pset-ink`, inkId on the attempt) — skipped by instruction.
- `S5.typeLabel('attempt')` / search skip list in ui.js — not needed (attempt records have no searchable text fields).

## الاختبار

`node tests/serve.mjs dist/studio5.html 8950 &` then `BASE=http://localhost:8950/ node tests/col-m3-pset.mjs`.
Checks: campus civil room → pset with a statics problem; arch room shows only arch/both generators; Arabic problem
text in data-noi18n; decimal inputs + unit pickers; N-for-kN → `unit` + message; negated → `sign`; correct → "Correct",
all steps, attempt {score 1, tier E2, fade 0}; fade 0→1→2 on two correct; wrong stores `wrong` and drops one level;
level 3 shows no steps and records E3; 3 unaided distinct-seed correct → chip `practicing` then `secure` (not mastered);
"Show a step" at level 3 → E2; typed input survives a store change and a re-render; reload keeps seed + hint;
attempts persist and are in `S5.backup.build()`; Practice card and lesson button; no untranslated English on the
pset screens in Arabic; zero pageerror.
