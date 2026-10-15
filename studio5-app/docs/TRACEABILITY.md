# Studio5 app — College traceability

Requirements of `docs/COLLEGE_PLAN.md`, one line per milestone. Status changes to DONE only after merge and push.

| ID | Requirement | Task | Status | Evidence |
|---|---|---|---|---|
| `S5-COL-M1` | Honest mastery and durable progress: shuffled MCQ choices, self-check (E0) out of the lesson score, subject lists per program/year, library precached and retried, tutor/studio progress in backups | `docs/tasks/COLLEGE-M1.md` | DONE (independent review PASS, 3 minor notes open) | `tests/col-m1-integrity.mjs` |
| `S5-COL-M2` | Exact-grading engine (seeded generators, SI units, Arabic-digit parsing, structured error codes, mastery states, numGuard) + 6 statics generators | `docs/tasks/COLLEGE-M2.md` | DONE (rigor review: 3 majors fixed by orchestrator; minors open) | `tests/col-m2-engine.mjs`, selftest step |
| `S5-COL-M3` | Problem room: seeded statics problems graded by code with feedback per error code, code-made steps, worked-example fading 0–3 (E2 → E3 unaided), objective mastery chips, attempt records, civil/arch campus rooms, lesson "Graded practice" button | `docs/tasks/COLLEGE-M3.md` | DONE (builder-verified; independent review owed) | `tests/col-m3-pset.mjs`, `tests/ar.mjs` pset routes |
| `S5-COL-M8` | Studio jury: 3 Year-1 rubrics, self-score first, AI juror (E1, code-validated), professor scores (EP), calibration | `docs/tasks/COLLEGE-M8.md` | DONE (builder-verified; independent review not run — usage limit) | `tests/col-m8-jury.mjs` |
