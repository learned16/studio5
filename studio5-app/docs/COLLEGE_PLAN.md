# COLLEGE_PLAN.md — Studio5 as a rigorous virtual college

## الرؤية والحدود الصادقة (Vision and honest limits)

Studio5 should give the owner, a first-year student in both Architecture (NTU, Kirkuk) and Civil Engineering (University of Kirkuk), a study experience that is as rigorous as possible: clear objectives, practice graded exactly by code, mastery that has to be earned, spaced retrieval, timed exams, and design juries scored against a rubric.

What the app **cannot** do, and must say so in the UI:
- It cannot grant a degree or a grade. The professor's mark and the real jury decide.
- It cannot replace physical labs, workshops, site visits or a live critique.
- "Harvard/MIT level" means the **rigor of practice and the alignment of topics** with open syllabi (MIT OCW 18.01/18.02/2.001/1.050/8.01, Harvard GSD 1101/1121). Topics are aligned only; no content is copied. Every benchmark link shows `unverified` until the owner checks it against the published outline.
- The library (409 lessons) is revision-card depth. Its worked examples are never used as answer keys. Answer keys come only from code-tested solvers.

## 1. معيار الصرامة (Rigor standard)

### 1.1 Code grades, the AI talks
- Every number that affects a mark comes from a pure JS `solve(params)`. Gemma (Workers AI, about 300 requests a day shared, hallucinates numbers) **never** produces a mark or an answer key.
- The AI explains, asks Socratic questions and critiques. It receives the code's numbers as fixed facts ("trust these numbers"), following the existing `studioTeacher` pattern (studio.js:193-215).
- A deterministic `S5.numGuard(text, allowed)` marks any number in an AI reply that is not in the allowed set (the parameters, intermediate steps, keys, the student's values, small integers). Flagged numbers show an "unverified number" badge.

### 1.2 Evidence tiers (from Proposal 1)
Every graded event carries a tier:

| Tier | Source | Counts toward mastery? |
|---|---|---|
| E0 | Self-rating ("I got it", mastery dropdown, flat-pressure studio pass) | No. Shown as "self-check". |
| E1 | AI opinion (checkAnswer, AI juror) | No. Shown as "AI opinion · verify". |
| E2 | Graded by code with help (steps visible, hint used, KB MCQ) | Practice only |
| E3 | Graded by code, unaided, fresh seed | Yes |
| E4 | E3 under retrieval or timed-exam conditions | Yes, strongest |
| EP | Professor or jury score typed in verbatim | Authoritative for studio work |

### 1.3 Mastery state: a pure function, computed from attempts, never stored
`S5.mastery.state(attempts, nowISO)` returns one of:
- `new`: no attempts yet.
- `practicing`: some attempts, but not yet secure.
- `secure`: at least 3 correct E3/E4 attempts on **different seeds**, and the most recent unaided attempt is correct. This is the highest state reachable before M5.
- `mastered`: secure, **plus** correct evidence on at least 2 calendar days, **plus** at least 1 correct E4 attempt.
- `due`: mastered, but the Leitner interval (1/3/7/16/35 days, counted by successful E4 retrievals) has passed.
- `fragile`: the last E4 retrieval failed.

Half credit (`rounding`) never counts.

### 1.4 Grading rules (from Proposal 2)
`S5.grade(input, key)` returns `{ok, score, code}`.

Tolerances:
- **Default:** 1% relative, with an absolute floor of 0.5% of the largest key in the same problem (for answers near zero).
- **Geometry answers** (centroid, I): 0.5%.
- **Exact math answers:** 1e-9 when typed as a fraction (`7/3`), 0.1% as a decimal.
- **Angles:** ±0.5° in mechanics, ±0.1° in math.

Error codes:
- `ok`
- `rounding`: 1–3% off, half credit, no mastery.
- `unit`: 10ⁿ scale slip, for example N given where kN is asked.
- `sign`: wrong sign or wrong tension/compression sense.
- `x2`
- `deg-rad`
- `wrong`
- `empty`

These are **structured codes**, not regex over Arabic text.

Input and units:
- Input accepts Arabic-Indic digits (٠–٩), the `٫` decimal mark and a comma decimal (the MatePad keyboard), with `inputmode=decimal`.
- Each answer field has a unit picker per dimension (N/kN/MN, mm/cm/m, N·m/kN·m, Pa/kPa/MPa/GPa, mm⁴/cm⁴/m⁴, deg/rad). The answer is converted to SI before comparing.

### 1.5 Answer keys are verified twice
- Each generator is tested over 200–300 seeds against an **independent** check: equilibrium residuals |ΣF|, |ΣM| < 1e-6 computed by the test itself, a finite-difference derivative, Simpson's rule for integrals, `S5.sunPos`, or `TOOL_DEFS` outputs.
- Each generator carries a `kb` instance that reproduces its library lesson's worked example. If they disagree, **the lesson is flagged for review**; neither side is trusted automatically. Facts that kb/PROGRESS.md marks as unreviewed are never used as keys.

## 2. البنية (Architecture)

> **Implementation note (overrides file names below):** college modules live in `src/college/NN-name.js` (e.g. `10-problems.js`, `20-gens-y1.js`, `30-view-pset.js`). build.mjs loads them automatically in filename order after tutor.js and before campus.js. Shared files are NOT edited for registration: use the hooks `S5.CAMPUS_EXTRA`, `S5.LIVE_EXTRA`, `S5.ROOT_EXTRA` (see `src/college/README.md`). UI strings go in `src/i18n-ar-m<N>.txt` (one per milestone, auto-loaded). Tests are `tests/col-m<N>-*.mjs` (auto-run by run-all.sh, must set `process.exitCode = 1` on failure).

### Constraints that shape every file
- All src/*.js files are joined into one `"use strict"` script with a shared scope. Every new module is an IIFE that attaches only to `S5.*`, because a top-level `const` named R, ok, H, kv, lines, warn and so on is a SyntaxError that stops the whole app.
- In build.mjs `order`, insert `"problems.js", "gens-y1.js", "view-pset.js"` after `"tutor.js"` and before `"campus.js"`. Later milestones add `"view-exam.js"`, `"professor.js"` and `"jury.js"` in the same slot.
- Add `"i18n-ar-6.txt"` to the build.mjs dictionary list for all new UI strings. Problem text carries its own `ar` and `en` and is rendered with `data-noi18n`, picking the language with `S5.i18n.lang()`.
- Views that hold inputs or timers (`pset`, `exam`, `office`, `jury`, `retrieval`) are added to `S5.LIVE` in main.js:24, so a store `change` does not wipe typed answers. They are mapped in `S5.ui.root()` (ui.js:83).
- Static content (problems, objectives, rubrics, professor personas, the syllabus map) lives in code. It is **not** seeded as records, which avoids the seed guard at curriculum.js:202 and saves memory.
- No new dependencies. No Pyodide. Generators and graders are cheap pure functions that run headless.

### New modules
- **`src/problems.js`** (engine):
  - `S5.rng(seed)`: Park-Miller, pulled out of the campus.js:128 pattern.
  - `S5.hashSeed(str)`
  - `S5.units`: `{sym: {dim, toSI}}`
  - `S5.parseNum(str)`
  - `S5.grade(input, key)`
  - `S5.TIERS`
  - `S5.PROB` registry
  - `S5.OBJ` registry, a minimal objective list grown per milestone
  - `S5.mastery.state(attempts, now)`, `S5.mastery.of(objId)` (cached, cache cleared on bus `change` for `attempt` records), `S5.mastery.dueList(now)`
  - `S5.numGuard(text, allowed)`

  Generator contract:
  ```
  S5.PROB[id] = {v, obj, lesson, subject, program, lvl,
    gen(rng) → params,
    solve(p) → {k: SI number},
    fields(p) → [{k, dim, units[], tol, sense?}],
    text(p, lang) → string,
    steps(p, lang) → [string],
    svg?(p),
    kb?: {lesson, p, expect}}
  ```
- **`src/gens-y1.js`**: the Year-1 generators (statics first, then calculus, architecture, materials).
- **`src/view-pset.js`**: view `pset` (Problem room), `S5.act['pset-*']`, worked-example fading.
- Later: **`src/view-exam.js`** (view `exam`, `S5.examLock`), **`src/professor.js`** (`S5.PROFS`, view `office`), **`src/jury.js`** (`S5.RUBRICS`, view `jury`), **`src/syllabus.js`** (`S5.SYLLABUS` objectives with Bloom level, prerequisites and benchmarks, plus view `transcript`).

### Data model (additive only; new record types need no migration)
- **`attempt`**: `{pid, v, seed, obj, lesson, given:{k:[num, unit]}, codes:{k:code}, score, tier, mode:'practice'|'retrieval'|'check'|'exam', fade, ms, examId?, inkId?}`.
  - One record per submit, never per keystroke.
  - Params are not stored, because `pid + v + seed` reproduces them.
  - This is the single source of truth for mastery.
- **`exam`**: `{subject, seed, minutes, startedAt, endsAt, items:[{kind:'gen'|'mcq', ref, seed, marks, obj}], answers[], submittedAt, score, byObj}`.
- **`officehour`**: `{prof, subject, msgs (newest 30), checks:[attemptId]}`.
- **`jury`**: `{rubric, projectId?, boardKey, intent, self:{}, ai:{scores, questions}, prof:{}, profVerbatim, total}`.

Legacy progress:
- `meta.tutorProg` and `meta.studioProg` stay where they are, so an older install can still read them.
- M1 adds them to backup as `body.progress`.
- Restore skips `body.progress` when it is missing, so old backups still restore.
- No `SCHEMA_VERSION` bump is needed. Recovery from a bad build is to ignore the new types and fields.

Per-device convenience:
- `S5.ls` keeps `pset_cur_<obj>` (the current seed, so a reload resumes the same item) and the AI explanation cache.
- Losing either is harmless.

### AI wiring (only the governed path `S5.ai.ask`)
Changes to ai.js:
- `run()` passes `temperature` and `max_tokens` through. The Worker already accepts both.
- Per-feature daily budgets: Office hours 20, Jury 6, Explain 15.
- `onText` accepts either a string or `{text}`.
- RULES mention **both** programs.
- `S5.examLock` rejects calls with `{code:'exam'}`.
- `ai.mockExam` asks for `{"items":[...]}` instead of a top-level array.

Replies render through `S5.tcRender` inside `.ai-out`.

### Campus integration (rooms only, no new buildings)
- **Civil:** "Problem room" `{v:'pset', kind:'civil'}`, "Statics professor" `{v:'office', id:'statics'}`.
- **Architecture:** "Problem room" `{v:'pset', kind:'arch'}`, "Design professor" `{v:'office', id:'design'}`.
- **Lecture Hall:** "Daily retrieval" `{v:'retrieval'}`, "Exam hall" `{v:'exam'}`.
- **Studio:** "Jury room" `{v:'jury'}`.
- **Library:** the description takes the lesson count from `S5.kb` instead of the hard-coded "409".

campus-e2e already enters every room, so new rooms are covered automatically.

## 3. خطة العمل الليلة (Overnight run)

The owner asked for continuous work until Thursday 2026-10-15 12:00 Baghdad (09:00 UTC), when the weekly usage limit renews. An hourly routine wakes the session after any usage-limit pause.
- Every push to `claude/zen-bell-oqcqtr` deploys to production, and devices reload themselves within about 10 minutes, so only green, reviewed work is pushed.
- Order: M1 ∥ M2 → M3 ∥ M4 → M5 ∥ M6 ∥ M7 → M8 → M9, as far as time allows. Independent milestones are built in parallel in separate git worktrees and merged.
- Each milestone stays shippable on its own; whatever is not finished stays listed in the progress log for the next run.

Before every push:
- `node build.mjs`
- `bash tests/run-all.sh` **with its JSON output read**, since most legacy tests do not assert
- an independent adversarial review (answer keys re-derived independently; regressions; i18n; MatePad weight)
- commit `dist/` and `public/` together with the source
- `git pull --rebase` first (the weekly library routine also pushes to this branch; rebuild on conflicts in built files)

### Rules for every milestone
- A `docs/tasks/<ID>.md` task file and a `docs/TRACEABILITY.md` line (AGENTS.md).
- Every new test in `tests/` uses the tutor-e2e.mjs header, sets `process.exitCode = 1` on any false check, and is registered in tests/run-all.sh.
- New UI strings get lines in `src/i18n-ar-6.txt`.
- Each milestone is shippable alone and leaves the app working if later milestones never happen.

## 4. المراحل (Milestones)

**M1 — Honest mastery and durable progress (Push A, about 90 min).**
- tutor.js:
  - Seeded shuffle of MCQ choices at render, keeping `data-j` as the stored index.
  - Self-graded short answers are recorded as E0 and left out of `lessonScore`.
  - `S5.kb.forSubject(name, {program, year})`, used by Start and Next lesson.
  - `kb.load` retries instead of caching `[]` for the whole session.
- build.mjs: precache `/kb/library.json` in the sw.js SHELL.
- core.js: `backup.build` adds `body.progress = {tutorProg, studioProg}`. Restore merges per id and the newer `at` wins.
- tutor-e2e.mjs:32: click the mapped position of the correct answer.
- Test `tests/integrity-e2e.mjs`.

**M2 — Exact-grading engine plus 6 statics generators (about 120 min).**
- `src/problems.js`, and `src/gens-y1.js` with 6 statics generators: 2D resultant, particle on two cables, moment about a point, beam reactions (UDL plus point load), triangular truss joint, composite T-section centroid.
- A "Problem engine" step in selftest.js runs 20 seeds per generator.
- Not yet visible in the UI. It ships safely because it adds functions only.
- Test `tests/engine-e2e.mjs`.

**M3 — Problem room, attempts, mastery, fading, campus rooms (Push B, about 120 min).**
- View `pset` (in LIVE):
  - Problem text, Arabic first.
  - One input plus a unit picker per answer field, and a sense picker where needed.
  - Feedback by error code.
  - Code-made steps shown after submitting.
  - A "New numbers" button.
- Worked-example fading (from Proposal 1):
  - Level 0 shows all steps.
  - Each correct answer hides one more step, down to level 3, where nothing is shown.
  - An error goes back one level.
  - Levels 0–2 are E2. Level 3 unaided is E3.
- Objective chips show each objective's state.
- A "Graded practice" button on mapped lesson pages.
- An optional `S5.Ink` scratch pad, saved as an inkpage linked to the attempt.
- The Civil and Arch Problem rooms in campus.js.
- Test `tests/pset-e2e.mjs`.

**M4 — Year-1 generators for both programs, with shared objectives (Push C, about 90 min).**
- Calculus, shared by `c1-math-*` and `a1b-calc-*` so that credit transfers between programs: derivative at a point, definite integral, closed-interval optimisation, area between curves.
- Architecture: drawing-scale conversion (a1b-ed-02), noon sun altitude plus overhang at Kirkuk/Mosul/Baghdad (a1-des-09, checked with `S5.sunPos`), Blondel stair.
- Materials: 150 mm cube strength P/A, nominal-mix quantities.
- Mechanics: friction on an incline.
- Test `tests/gens-e2e.mjs`.

**M5 — Daily interleaved retrieval (about 90 min).**
- View `retrieval`, at most 12 items, built from `S5.mastery.dueList()` plus due `tutorProg` lessons.
- Never two items from the same objective in a row.
- Each item uses a fresh seed that is not in the attempt history, with no steps shown. Items are recorded as E4.
- The mastered, due and fragile states become reachable.
- Today shows "Retrieval due N".
- `S5.notifications` gets an entry.
- The Study review queue includes due objectives and due tutor lessons.
- Lecture Hall room.

**M6 — Exam hall (about 120 min).**
- View `exam`:
  - Built from a blueprint of seeded generators plus shuffled KB MCQ items for one subject.
  - Seeds are frozen into the `exam` record at start.
  - The timer runs from `endsAt` and is enforced: inputs lock and the exam submits itself.
  - Saved on every answer, and resumes after a reload.
- `S5.examLock` hides the tutor, AI and tab bar, and `S5.ai.ask` rejects with code `exam`.
- Weighted marks, with a per-objective breakdown.
- Answers are written as E4 attempts.
- Wrong items become `problem` records that are retried with a new seed.
- `ai.mockExam` asks for `{"items":[...]}` and its questions are labelled "practice, not graded".
- Lecture Hall room.

**M7 — Subject professors and office hours (about 120 min).**
- `src/professor.js`, with fictional personas (Statics, Mathematics, Design) and no real names.
- View `office`, saved in `officehour`.
- Context built by code: the subject's objectives with their mastery states, and the last wrong attempt with its parameters, keys and error codes.
- "Explain my mistake" is also available on `pset`, cached in `S5.ls` by `pid|code|lang`.
- The professor can write `[[check:pid]]`, which renders a fresh sibling item inline, graded by code (mode `check`). This is the Socratic check question, and it is counted.
- `numGuard` runs on every reply.
- When the budget is used up, it falls back to the code-made steps.
- ai.js changes (temperature/max_tokens passthrough, per-feature budgets, onText fix, RULES for both programs).
- Campus rooms.

**M8 — Studio jury with rubrics (about 120 min).**
- `src/jury.js` with 3 Year-1 architecture rubrics:
  - composition of primary forms;
  - bubble diagram and zoning;
  - freehand perspective sheet.
- Each has 4–6 criteria (vocabulary aligned with GSD 1101), 4 bilingual levels and weights.
- Flow:
  1. Pin up a board (photo or ink page, downscaled to at most 1280 px, JPEG 0.85) and write an intent statement.
  2. The student must score themselves first.
  3. The AI juror runs in JSON mode at temperature 0.2 and returns `{"criteria":[{id, level, evidence}], "questions":[]}` (E1). Code drops unknown ids, clamps levels to 1–4 and computes the weighted total.
  4. The professor's scores are typed in verbatim (EP).
- A calibration table compares self, AI and professor.
- Studio room.

**M9 — Syllabus map, benchmark, KB quality gate, transcript (about 90 min).**
- `src/syllabus.js` lists objectives per Year-1 subject with Bloom level, prerequisites, lesson ids, problem ids and benchmarks `{src:'MIT OCW 18.01', topic, verified:false}`.
- Soft gating: a lock badge plus "study anyway", recorded as an override.
- Coverage page per subject.
- A printable transcript that lists only E3/E4/EP evidence as mastered, with the dates.
- Build-time checks:
  - subject names exist in CURRICULUM/CIVIL;
  - lesson and problem ids exist;
  - the prerequisite graph has no cycles;
  - a report of where the correct MCQ answers sit.

## 5. المخاطر (Risks)

- **Production deploys on push.** Mitigated by the per-push gate in §3 and failing tests via `exitCode`.
- **Shared script scope and load order.** Mitigated by IIFE modules and the build order given in §2. Every e2e test checks for zero `pageerror`.
- **Wrong answer keys.** Mitigated by independent checks in tests, `kb` cross-checks that flag lessons, and never trusting kb/PROGRESS.md "to review" facts.
- **AI budget** (300 requests a day across devices; the Worker's cost estimate is too optimistic). Mitigated by user-triggered calls only, per-feature budgets, the explanation cache, and never calling the AI automatically from pset.
- **Performance on the MatePad and the 12 GB laptop** (`store.list` is a linear scan). Mitigated by one attempt per submit, the mastery cache cleared on change, and no params in records.
- **Device sync.** The standalone app has no live sync. Attempts are records, so Backup→Restore (merge by `updatedAt`) carries them. `body.progress` covers legacy meta.
- **i18n.** Exact-match dictionary. New strings go in i18n-ar-6.txt, problem text is bilingual inside the generator, and tests/ar.mjs adds the new routes.
- **Pen and pressure claims** (scratch pad, studio) need a real MatePad test and are marked NEEDS DECISION until done.

## 6. قرارات للمستخدم (NEEDS DECISION)

1. **Gating:** soft gating (badge plus recorded override, recommended) or hard locks.
2. **Thresholds:** 3 distinct-seed correct answers, 2 days, 1 E4, 1% tolerance.
3. **Priority subject:** if a specific exam is coming, M4 should prioritise that subject's generators (calculus, statics or drawing scale).
4. **Legacy progress:** keep `meta` progress backed up (M1), or move it to records later with `SCHEMA_VERSION` 4.

## 7. Proposal scoring (judge)

Scores are on a 1–10 scale, for rigor / fit with the code / AI safety / lightness / feasibility in about 10 hours:

| Proposal | Rigor | Fit | AI safety | Lightness | Feasibility | Why |
|---|---|---|---|---|---|---|
| P1 learning-science | 9 | 8 | 9 | 8 | 6 | Best rigor ideas: evidence tiers, independent residual checks, fading, retrieval interleaving. Its first four milestones are tight for one night. |
| P2 engineering-curriculum | 9 | 7 | 9 | 8 | 5 | Best grading and tolerance rules, generator contract with `kb` cross-check, and Year-1 topic map. Too many files and milestones for the deadline. |
| P3 product | 7 | 9 | 8 | 9 | 7 | Best push sequencing, campus integration, office hours with graded `[[check]]`, computed mastery and the AI wiring fixes. Its mastery rule is weaker. |

**Backbone:** P3's structure and push plan.

**Grafts:**
- From P1: evidence tiers, the mastery states and decay, independent solver checks, worked-example fading, interleaved E4 retrieval, the transcript.
- From P2: the tolerance and unit rules, the generator contract with a `kb` instance, the Year-1 topic-to-grading map.

## Appendix — milestone specs

### M1 — Honest mastery and durable progress (Push A)
**Goal:** Stop fake 'Lesson mastered' results (68% of MCQ answers are B, and short answers are self-graded), keep civil and arch lessons apart, keep the library available offline, and stop progress being lost on backup/restore.

**Scope:**
src/tutor.js:
- lessonHTML (~179): render MCQ choices in an order shuffled by a seed (S5.hashSeed(lessonId + viewNonce)), keeping data-j = stored index.
- lessonScore (~187): drop self-graded (ls-self) items from n and ok; show them as 'self-check'.
- S5.kb.forSubject(name, {program, year}): filter by program (honouring 'both') and year; used by lessonsHTML Start/Continue and by Next lesson (~176, 184).
- S5.kb.load: on fetch failure do not cache []; retry on the next call.
build.mjs: add './kb/library.json' to the sw.js SHELL precache list.
src/core.js:
- backup.build (~340): add body.progress = {tutorProg: meta.tutorProg, studioProg: meta.studioProg}.
- restore (~360): if body.progress exists, merge per lesson id, newer `at` wins, then setMeta. Skip silently when absent (old backups).
tests/tutor-e2e.mjs:32: click the shuffled position whose data-j equals q.answer.
src/i18n-ar-6.txt (new, added to build.mjs dictionary list): 'self-check' and any new strings.
docs/tasks/COLLEGE-M1.md with a recovery note; docs/TRACEABILITY.md line.

**Acceptance:**
- Clicking display position 2 on every MCQ across the 127 all-B lessons masters fewer than 10% of them (today 100%)
- Pressing 'I got it' alone never yields a lesson score of 0.8 or more; self-check buttons do not change the score
- forSubject('Engineering Drawing', {program:'civil', year:1}) returns only c1b-draw-* in order; Next lesson stays within c1b-*
- Built public/sw.js precache list contains /kb/library.json; a simulated failed first fetch followed by success loads the library in the same session
- tutorProg and studioProg made in context A are identical after backup -> restore('replace') in a fresh context B; an old-format backup (no progress field) restores without error and its checksum verifies
- Existing tutor-e2e quiz and studio-e2e checks still pass; zero pageerror events

**Test:** tests/integrity-e2e.mjs (port 8765, plus 8787 for the sw.js check): asserts the all-B mastery rate, self-check exclusion, the forSubject program/year filter and Next lesson, sw precache, and progress round-trip through backup/restore including the old-format backup; sets process.exitCode=1 on any failure; registered in tests/run-all.sh.

**Depends on:** —

### M2 — Exact-grading engine plus 6 statics generators
**Goal:** A pure, headless engine that generates seeded problems, computes answer keys in code, grades numeric input with units and tolerance, returns structured misconception codes, and computes mastery state from attempts.

**Scope:**
src/problems.js (new, an IIFE that attaches only to S5; add to build.mjs order after tutor.js):
- S5.rng(seed): Park-Miller, the campus.js:128 pattern
- S5.hashSeed(str)
- S5.units {sym: {dim, toSI}} for N/kN/MN, mm/cm/m, N·m/kN·m, Pa/kPa/MPa/GPa, mm⁴/cm⁴/m⁴, deg/rad
- S5.parseNum(str): Arabic-Indic digits, ٫ and comma decimals, fractions like 7/3
- S5.grade(input, unit, key, field) -> {ok, score, code}, with codes ok|rounding|unit|sign|x2|deg-rad|wrong|empty. Tolerances: 1% default with an abs floor of 0.5% of the max key; geometry 0.5%; angles ±0.5°; 1–3% off = rounding with half credit
- S5.TIERS {E0..E4, EP}
- S5.PROB and S5.OBJ registries
- S5.mastery.state(attempts, nowISO) -> new|practicing|secure|mastered|due|fragile (pure); S5.mastery.of(objId) cached and cleared on bus change for attempt records; S5.mastery.dueList(now)
- S5.numGuard(text, allowed) -> flagged numbers
src/gens-y1.js (new IIFE, after problems.js): mech.resultant, mech.particle2cable, mech.moment, mech.beamReactions, mech.trussJoint3 (kb: c1b-mech-05), geo.compositeCentroid. Each follows the contract {v, obj, lesson, subject, program, lvl, gen, solve, fields, text(p, lang) ar+en, steps(p, lang), svg?, kb?}. Parameters come from 'nice' grids; truss angles are kept between 25° and 65°.
src/selftest.js: a 'Problem engine' step that runs 20 seeds per generator and fails on non-finite values or a self-grade that is not ok.
docs/tasks/COLLEGE-M2.md; TRACEABILITY line.

**Acceptance:**
- For 300 seeds per generator every key is finite and the same seed gives identical params
- grade(key) is ok; key×1.05 is wrong; key×1.02 is rounding with score 0.5; -key gives sign; the value in N when kN is expected gives unit
- parseNum('٣٫٥') === 3.5 and parseNum('7/3') is accepted within 1e-9
- An independent residual computed by the test itself (|ΣFx|, |ΣFy|, |ΣM| < 1e-6) holds for particle, beam and truss solutions
- The beamReactions instance L=5 m, w=12 kN/m gives R=30 kN and Mmax=37.5 kN·m, matching numbers parsed from TOOL_DEFS.beam.run
- The kb instance for trussJoint3 reproduces the c1b-mech-05 printed answer, or the test reports the lesson as flagged (it must not silently change the solver)
- mastery.state on crafted histories: 3 correct on the same seed is not secure; 3 correct unaided on distinct seeds is secure; hinted attempts (E2) never reach secure; mastered is unreachable without E4
- The app boots with zero pageerror (shared-scope safety)

**Test:** tests/engine-e2e.mjs (port 8765, page.evaluate): seeds determinism, grading codes, Arabic number parsing, independent equilibrium residuals, TOOL_DEFS beam agreement, kb cross-check, mastery.state truth table; exitCode=1 on failure; registered in run-all.sh.

**Depends on:** —

### M3 — Problem room: attempts, fading, mastery chips, campus rooms (Push B)
**Goal:** Give the owner unlimited fresh-number statics practice that code grades exactly, shows the code-made solution, fades the help and records evidence that survives backup.

**Scope:**
src/view-pset.js (new IIFE, after gens-y1.js):
- S5.views.pset(r) with r.kind 'civil'|'arch' and r.id = objective or problem id.
- Problem text in Arabic first (data-noi18n, language from S5.i18n.lang()), an svg if available, one input (inputmode=decimal) plus a unit picker per field, and a sense picker where needed.
- Submit -> S5.grade per field -> feedback per code (e.g. 'unit slip: you gave N, asked kN') -> steps(p) revealed.
- 'New numbers' draws a fresh seed.
- Worked-example fading levels 0–3: each correct answer hides one more step, an error goes back one level. Levels 0–2 record tier E2; level 3 unaided records E3.
- Optional S5.Ink scratch pad (noToolbar) saved as an inkpage, with inkId on the attempt.
- Objective chips from S5.mastery.of.
- S5.act['pset-submit'|'pset-new'|'pset-steps'|'pset-ink'].
- Current seed persisted in S5.ls 'pset_cur_<obj>' so a reload resumes the same item.
Records: S5.store.create('attempt', {pid, v, seed, obj, lesson, given, codes, score, tier, mode:'practice', fade, ms, inkId?}).
src/main.js:24: add 'pset' to S5.LIVE.
src/ui.js: map pset in S5.ui.root() (ui.js:83) to practice; typeLabel 'attempt'; add 'attempt' to the search skip list (ui.js:369).
src/tutor.js lessonHTML: a 'Graded practice' button when any S5.PROB has lesson === t.id.
src/view-practice.js: a 'Problem sets' tab or card.
src/campus.js: civil and arch building rooms ['Problem room', {v:'pset', kind}]; Library desc takes its count from S5.kb.
src/i18n-ar-6.txt: all new strings.
tests/ar.mjs: add the pset route.
docs/tasks/COLLEGE-M3.md; TRACEABILITY line.

**Acceptance:**
- Entering the campus 'Problem room' in the civil building opens pset with a statics problem
- Typing solve(params) (read through the S5.pset.cur test hook) in the right units shows 'Correct', reveals the code-made steps and saves an attempt with score 1 and the correct tier
- Entering the N value where kN is expected gives code unit and the unit message; a negated value gives sign
- Two correct answers move fade from 0 to 2; a wrong answer drops it one level and stores its code in the attempt
- Three unaided correct answers on distinct seeds make the objective chip show 'secure' (never 'mastered' before M5)
- After a reload the same seed is shown and the attempts persist; typed input survives a store change event (LIVE)
- S5.backup.build() contains the attempt records
- No pageerror; tests/ar.mjs reports 0 untranslated UI strings on the pset route; campus-e2e still enters every room

**Test:** tests/pset-e2e.mjs (port 8765): campus room entry, correct/unit/sign feedback, attempt record contents, fading progression, secure state after 3 distinct seeds, reload resume, LIVE input survival, backup contains attempts; exitCode=1 on failure; plus updated tests/ar.mjs route list.

**Depends on:** M2

### M4 — Year-1 generators for both programs with shared objectives (Push C, only if buffer remains)
**Goal:** Extend exactly graded practice to calculus (shared by Civil Mathematics I and Arch Principles of Calculus, so credit transfers once), architecture site/drawing problems and materials.

**Scope:**
src/gens-y1.js:
- calc.derivAtPoint, calc.defIntegral, calc.optimiseClosed, calc.areaBetween: obj ids calc.* linked to both c1-math-* and a1b-calc-* lessons.
- arch.scaleConvert (a1b-ed-02): ±0.5 mm on paper.
- arch.noonSunOverhang (a1-des-09): Kirkuk 35.47°N / Mosul / Baghdad, checked with S5.sunPos.
- arch.blondelStair.
- mat.cubeStrength (150 mm cube P/A).
- mat.nominalMix.
- mech.frictionIncline.
S5.OBJ entries with subject names copied exactly from curriculum.js.
src/view-pset.js: the arch Problem room lists the arch-relevant generators.
src/selftest.js: covers the new generators.
docs/tasks/COLLEGE-M4.md; TRACEABILITY line.

**Acceptance:**
- All 200 seeds of every new generator grade their own key ok and are finite
- Derivative keys agree with a central finite difference (rel < 1e-6); integral keys agree with Simpson's rule at n=1000 (rel < 1e-6)
- Kirkuk noon altitude on 21 June = 77.97° ±0.3° and agrees with S5.sunPos within ±0.5° for all seeds
- '7/3' and '2.333' are both accepted for the same exact answer at their respective tolerances
- A secure calc objective earned via c1-math-02 shows as secure on the a1b-calc-03 lesson page
- Every S5.OBJ subject string exists in S5.CURRICULUM or S5.CIVIL

**Test:** tests/gens-e2e.mjs (port 8765, page.evaluate): self-grade over 200 seeds, finite-difference and Simpson independent checks, sunPos agreement, fraction parsing, cross-program credit, subject-name validity; exitCode=1 on failure.

**Depends on:** M3

### M5 — Daily interleaved retrieval session
**Goal:** Turn secure skills into durable mastery with spaced, interleaved, unaided retrieval on fresh numbers (tier E4), shown on Today and in the Lecture Hall.

**Scope:**
src/view-pset.js (or src/view-retrieval.js, after view-pset.js): S5.views.retrieval:
- at most 12 items from S5.mastery.dueList(now) plus secure-but-never-retrieved objectives plus due S5.tutorProg lessons (shuffled KB MCQ);
- interleaved so no two consecutive items share an objective;
- each seed is fresh (not in attempt history), no steps shown, mode 'retrieval', tier E4;
- a pass advances the derived Leitner box (1/3/7/16/35 days); a fail makes the objective fragile and resets fade.
src/main.js: add 'retrieval' to LIVE.
src/view-today.js: a 'Retrieval due N' line with a button.
src/ui.js S5.notifications: a due-retrieval entry.
src/view-study.js review tab: due objectives and due tutor lessons.
src/campus.js: hall room ['Daily retrieval', {v:'retrieval'}].
i18n-ar-6.txt strings.
docs/tasks/COLLEGE-M5.md; TRACEABILITY line.

**Acceptance:**
- With seeded attempt histories for 5 objectives of which 3 are due, the session contains exactly those 3 objectives (plus due tutor lessons)
- No two consecutive items share an objective; no item seed appears in that objective's earlier attempts
- A correct E4 on a secure objective with evidence on 2 days makes it 'mastered'; successive passes move due dates by 1/3/7/16/35 days
- A failed retrieval makes the objective 'fragile'
- Today shows 'Retrieval due 3' and the campus room opens the session

**Test:** tests/retrieval-e2e.mjs (port 8765): seeded attempts, due selection, interleaving, seed freshness, state transitions secure->mastered->due->fragile, Leitner intervals, Today counter; exitCode=1 on failure.

**Depends on:** M3

### M6 — Exam hall: timed, enforced, code-graded
**Goal:** Real exam conditions: frozen seeded items, an enforced wall-clock limit, no AI or tutor during the exam, weighted marking by code with a per-objective breakdown, and misses fed into the error notebook.

**Scope:**
src/view-exam.js (new IIFE, after view-pset.js):
- S5.views.exam: setup by subject builds a blueprint of S5.PROB generators plus shuffled KB MCQ.
- An exam record {subject, seed, minutes, startedAt, endsAt, items:[{kind, ref, seed, marks, obj}], answers[], submittedAt, score, byObj}, saved on every answer and resumed from endsAt after a reload.
- Timer from endsAt; at 0 inputs are disabled and the exam submits itself.
- S5.examLock on/off hides the tab bar, tutor and AI buttons.
- Grading by S5.grade / MCQ index; attempts written with mode 'exam', tier E4, examId.
- Wrong items become S5.store.create('problem', {..., retryAt: +2 days, pid, seed}).
- Test clock hook S5.exam.now.
src/ai.js:
- ask() rejects {code:'exam'} while S5.examLock is set.
- mockExam prompt asks for {"items":[...]} and its questions are labelled 'practice, not graded'.
- view-study.js mock generation reads .items.
src/main.js: add 'exam' to LIVE.
src/campus.js: hall room ['Exam hall', {v:'exam'}].
i18n strings.
docs/tasks/COLLEGE-M6.md; TRACEABILITY line.

**Acceptance:**
- A 3-second exam (test clock) submits itself and all inputs become disabled
- A reload in the middle restores the same items, the answers given and a remaining time below the original
- With 3 of 6 items correct the score equals the code-computed weighted marks and byObj is present for every objective
- S5.ai.ask rejects with code 'exam' during the exam, and the tutor/AI buttons are absent
- Wrong items create problem records with retryAt +2 days
- S5.ai.mockExam handles an object reply {items:[...]} from the mock without throwing

**Test:** tests/exam-e2e.mjs (port 8787 with TUTOR_MOCK): auto-submit, reload resume, deterministic score and byObj, AI lock, error-notebook records, mockExam object shape; exitCode=1 on failure.

**Depends on:** M3

### M7 — Subject professors: office hours bound to code
**Goal:** A per-subject AI professor (fictional persona) that explains mistakes using numbers computed by code, asks Socratic check questions that code grades, and stays within a small AI budget.

**Scope:**
src/professor.js (new IIFE):
- S5.PROFS {statics, math, design}: persona, subject, objectives, Iraqi-Arabic style, no real names.
- S5.views.office(r): thread stored in an officehour record (newest 30 messages).
- Context built by code: the subject's objectives with S5.mastery states, and the last wrong attempt with params regenerated from the seed, keys, the student's values and codes.
- The student's text is placed last in the prompt.
- The reply is rendered with S5.tcRender in .ai-out.
- [[check:pid]] renders a fresh sibling item inline, graded by S5.grade and saved as an attempt with mode 'check'.
- S5.numGuard flags foreign numbers with an 'unverified number' badge.
- 'Explain my mistake' button on pset, cached in S5.ls by pid|code|lang.
src/ai.js:
- run() passes temperature and max_tokens through.
- Per-feature daily budgets (Office hours 20, Explain 15).
- onText accepts a string or {text}.
- RULES cover both programs (NTU Architecture and Kirkuk Civil).
- When over budget, show the code-made steps instead.
src/tutor.js: S5.tcRender handles the check tag.
src/main.js: 'office' in LIVE.
src/campus.js: civil 'Statics professor', arch 'Design professor', hall or lib 'Mathematics professor'.
i18n strings.
docs/tasks/COLLEGE-M7.md; TRACEABILITY line.

**Acceptance:**
- The streamed mock reply appears inside .ai-out and aiLog gets an entry with purpose 'Office hours'
- The prompt sent contains the code-computed key and the error code of the last wrong attempt
- A question ending in '[[check:mech.moment]] 999' renders a graded inline problem that saves an attempt with mode 'check', and '999' is flagged as unverified
- A repeated 'Explain my mistake' for the same pid|code leaves the aiLog length unchanged (cache hit)
- With the office-hours counter preset to 20 the next call is refused with the budget message and the steps are shown
- The thread survives a reload; Understanding Rescue streaming now shows text in standalone mode (onText fix)

**Test:** tests/office-e2e.mjs (port 8787, TUTOR_MOCK): .ai-out streaming, aiLog purpose, key in prompt (captured by wrapping S5.tutor.ask), check-tag grading, numGuard flag, cache, budget refusal, persistence; exitCode=1 on failure.

**Depends on:** M3

### M8 — Studio jury with rubrics
**Goal:** Studio critique like a real pin-up: an intent statement, self-scoring first, an AI juror whose scores are advice only, professor scores typed in verbatim, and calibration between the three.

**Scope:**
src/jury.js (new IIFE):
- S5.RUBRICS with 3 Year-1 arch rubrics (composition of primary forms; bubble diagram and zoning; freehand perspective sheet). Each has 4–6 criteria (GSD 1101-aligned vocabulary), 4 levels, bilingual descriptors and weights.
- S5.views.jury(r): pin up a board (file photo or ink page), downscaled to at most 1280 px as JPEG 0.85; intent text; self-score per criterion (required before the AI); AI juror via S5.ai.ask('Jury', ..., {json:true, temperature:0.2, images}) returning {"criteria":[{id, level, evidence}], "questions":[]}.
- Code validates the reply: drops unknown ids, clamps levels to 1–4 and computes the weighted totals. Labelled 'AI reading, not a grade' (E1).
- Professor score fields plus profVerbatim (EP); a calibration table of self vs AI vs professor deltas.
- jury record {rubric, projectId?, boardKey, intent, self, ai, prof, profVerbatim, total}.
- Jury budget 6/day.
src/main.js: 'jury' in LIVE.
src/campus.js: studio room ['Jury room', {v:'jury'}]; optional link from project pages.
i18n strings.
docs/tasks/COLLEGE-M8.md; TRACEABILITY line.

**Acceptance:**
- The AI juror cannot be called before every self-score is entered
- The mock reply {ok, echo} (wrong shape) shows 'juror unavailable' and nothing breaks
- A hand-injected valid object gives the expected weighted total; an unknown id is dropped and level 7 is clamped to 4
- The jury record holds the self, ai and prof columns and the deltas are computed
- aiLog shows images:1 for the jury call; no AI jury score ever changes S5.mastery

**Test:** tests/jury-e2e.mjs (port 8787, TUTOR_MOCK): self-first gate, malformed reply handling, validation and weighted total, record contents, aiLog image count, mastery unaffected; exitCode=1 on failure.

**Depends on:** M3

### M9 — Syllabus map, honest benchmark, KB quality gate, transcript
**Goal:** Make the Harvard/MIT claim honest and checkable: objectives per subject with Bloom level and prerequisites, topic alignment with open syllabi marked unverified, soft gating, a coverage view, and a transcript that counts only real evidence.

**Scope:**
src/syllabus.js (new IIFE):
- S5.SYLLABUS per Year-1 subject (both programs): objectives [{id, en, ar, bloom, prereq[], lessons[], probs[], bench:[{src:'MIT OCW 18.01'|'2.001'|'1.050'|'8.01'|'GSD 1101'|'GSD 1121', topic, verified:false}]}]. Topic titles only; no copied content. The S5.OBJ entries from M2/M4 are merged into it.
- Soft gating: a lock badge on pset/lesson when prereqs are not secure, with a 'study anyway' button that records an override attempt-less event in an 'override' record.
- S5.views.transcript: per subject, objectives marked mastered only from E3/E4/EP evidence, with dates; overrides listed; printable. Coverage per subject: objectives with lessons / with graded problems / mastered.
- The page states plainly 'matches the topics and rigor of practice; it is not a degree'.
build.mjs:
- a quality gate that fails the build on unknown subject names (vs curriculum.js), lesson ids, problem ids or a prereq cycle;
- prints an MCQ answer-position report.
src/campus.js: affairs room ['Transcript', {v:'transcript'}].
i18n strings.
docs/tasks/COLLEGE-M9.md; TRACEABILITY line.

**Acceptance:**
- The prerequisite graph has no cycles, and the build fails when a bogus lesson id or subject name is injected
- Coverage numbers on the page equal counts computed independently by the test
- An objective with only E0/E1/E2 evidence never shows as mastered on the transcript; an override appears on the transcript
- Every benchmark entry renders with an 'unverified' label until verified is true

**Test:** tests/syllabus-e2e.mjs (port 8765) plus a node-level build check run in run-all.sh: graph acyclicity, build failure on a bad id (on a temp copy), coverage equality, transcript evidence rules, unverified labels; exitCode=1 on failure.

**Depends on:** M4, M5

## Progress log

- 2026-10-14 22:30 UTC — plan written (5 code readers, 3 independent proposals, 1 judge). Starting M1 ∥ M2.
- 2026-10-14 23:10 → 2026-10-15 02:50 UTC — usage limit; M1/M2 work-in-progress saved as commits and resumed.
- 2026-10-15 ~05:30 → 07:50 UTC — usage limit again (reviews/fixes interrupted).
- 2026-10-15 08:00 UTC — **M1 DONE** (honest lesson scores, shuffled MCQs, program/year subject lists, library precache, progress in backups; review PASS). **M2 DONE** (exact-grading engine + 6 statics generators; independent rigor review found 3 majors — half-credit band past 3%, Leitner box per item instead of per day, numGuard missing Arabic proclitics — all fixed and re-tested). **M8 DONE** (studio jury with rubrics; builder-verified, independent review still owed). Next: M3, then M4 more generators, M5 retrieval, M6 exam hall, M7 professors, M9 syllabus/transcript.
- Open minor notes: restore message should mention merged progress; tutorProg keeps an old self-check note on retake; 'exact' fraction tolerance; deg-rad feedback too eager; owner decision on 'fragile' definition (see M2 review).
- 2026-10-15 08:30 UTC — **M3 DONE** (Problem room in the civil and architecture buildings: fresh-number statics problems graded by code, unit/sign/×2 feedback, code-made steps with fading 0–3, attempts and mastery chips, 'Graded practice' on mapped lessons; builder-verified, independent review still owed). Full suite green. **Next run:** reviews for M3 and M8, then M4 (calculus/architecture/materials generators), M5 daily retrieval, M6 exam hall, M7 subject professors, M9 syllabus map + transcript.
- 2026-10-15 08:47 UTC — independent reviews of M3 and M8 ran. Fixed now: a double tap on Submit saved two attempts; a truss/moment answer with no sense chosen was graded as the positive sense; the jury self-score lock could be undone by clearing the professor's scores. Also fixed: fade pill now reads "Independence N/3", attempts are kept out of search, 40 px touch targets on the answer inputs and pickers (still to confirm on the MatePad). Still open (minor, next run): unit-slip message names the picked unit as 'asked'; remaining M8 minors in the review output.
