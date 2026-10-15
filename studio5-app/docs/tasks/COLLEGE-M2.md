# COLLEGE-M2 — Exact-grading engine + 6 statics generators

## الحالة

`AUTOMATED PASS` (tests/col-m2-engine.mjs). Not visible in the UI yet: it adds functions only.

## الهدف

A pure, headless engine (docs/COLLEGE_PLAN.md §1, §2, Appendix M2): seeded problems, answer keys computed by code,
unit-aware grading with tolerances and structured misconception codes, mastery computed from attempt records,
and a guard that flags numbers in AI text that code did not produce. Gemma never produces a key.

## النطاق والملفات

- `src/college/10-problems.js`: `S5.rng`, `S5.hashSeed`, `S5.newSeed`, `S5.units` (+ `S5.addUnits`, `S5.unitNorm`,
  `S5.unitsOf`, `S5.toSI`, `S5.fromSI`), `S5.parseNum` / `S5.parseNumInfo`, `S5.grade`, `S5.TOL`, `S5.TIERS`,
  `S5.GRADE_CODES`, `S5.PROB`, `S5.OBJ`, `S5.prob` (register, instance, reproduce, grade, record, selfCheck, kbCheck),
  `S5.mastery` (info, state, of, infoOf, dueList), `S5.numGuard` (+ `scan`, `allowedFrom`).
- `src/college/20-gens-y1.js`: `mech.resultant`, `mech.particle2cable`, `mech.moment`, `mech.beamReactions`,
  `mech.trussJoint3`, `geo.compositeCentroid`, and their 6 objectives (`statics.*`). Each carries a `kb` instance.
- `src/selftest.js`: step "Problem engine" (20 seeds per generator; fails on non-finite values or an own key not graded ok).
- `src/i18n-ar-m2.txt`: Arabic for the engine's UI labels (tiers, codes, mastery states, selftest note).
- `tests/col-m2-engine.mjs`.

## قرارات تفصيلية (within the plan)

- Grading floor: 0.5% of the largest key of the same dimension (§1.4). Generators keep same-dimension answers within
  ≈3× of each other (min ≥ 0.35 × max) so that floor never loosens a small answer past the 1% / 3% bands
  (the first draft let a small truss member pass at up to 10% off).
- `fragile` = the latest E4 failed on a skill that had been secured (≥3 distinct-seed unaided correct answers before it).
  An E4 miss (e.g. an exam item) on a skill never secured leaves it `practicing`. `mastered` needs the latest E4 passed.
- "1,500" is graded both as 1.5 (MatePad decimal comma) and as 1500; the better reading counts.
- A disagreement between a generator and its lesson's printed worked example flags the lesson; the solver is not tuned.
  Today all 7 examples agree (c1b-mech-01..05, c1b-mech-09, a2-mec-04).

## البيانات والاسترجاع (Data and recovery)

- No schema change, no migration. `attempt` records (written from M3 on) are a new additive type:
  `{pid, v, seed, obj, lesson, given, codes, score, tier, mode, fade, ms, examId?, inkId?}` — params are not stored.
- Recovery from a bad build: the engine only adds `S5.*` functions; removing `src/college/10-problems.js` and
  `20-gens-y1.js` restores the previous app. Old data and old backups are untouched.

## معايير القبول (proved by tests/col-m2-engine.mjs)

- 300 seeds per generator: finite keys, identical params for the same seed.
- grade(key) ok; ×1.05 wrong; ×1.02 rounding (0.5); −key sign; N value under kN unit — on every answer field.
- parseNum('٣٫٥') === 3.5; '7/3' accepted within 1e-9.
- Independent residuals (|ΣFx|, |ΣFy|, |ΣM| < 1e-6) computed by the test for particle, beam, truss (and the other three).
- beamReactions L=5, w=12 → R=30 kN, Mmax=37.5 kN·m = TOOL_DEFS.beam.run.
- trussJoint3 kb reproduces c1b-mech-05 (or the test reports it flagged).
- mastery.state truth table; zero pageerror.

## غير منجز هنا

- `docs/TRACEABILITY.md` (repository root) is outside this worktree task's folder; the orchestrator adds the line.
