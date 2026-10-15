# COLLEGE-M1 — Honest mastery and durable progress (Push A)

Plan: `docs/COLLEGE_PLAN.md` §4 M1 and "Appendix — milestone specs / M1". Branch: `impl-m1-w1` (worktree, not pushed).

## الهدف (Goal)

Stop fake "Lesson mastered" results (68% of the library's MCQ answers are stored at index 1 = B, 127 lessons have
every MCQ answer = B, and short answers were self-graded into the score), keep civil and architecture lessons of the
same subject name apart, keep the library available offline, and stop tutor/studio progress being lost on
backup → restore.

## Requirement

- `S5-COL-M1` (new line in `docs/TRACEABILITY.md`).

## الملفات (Files changed)

- `src/tutor.js` — `S5.kb.load` retry, `S5.kb.forSubject(name, {program, year})`, `S5.kb.order(n, key)` seeded
  shuffle, lesson quiz rendering/scoring, `S5.tutorProg.set(id, score, self)` + `markSelf`, library failure screen.
- `src/core.js` — `S5.backup.build` adds `body.progress`; `restore` merges it (`mergeProgress`, `restoreProgress`).
- `build.mjs` — `./kb/library.json` added to the sw.js `SHELL` precache list.
- `src/i18n-ar-m1.txt` — new UI strings (auto-loaded by build.mjs).
- `tests/col-m1-integrity.mjs` — milestone test (auto-run by `tests/run-all.sh`).
- `tests/tutor-e2e.mjs` — the quiz now clicks the shown position whose `data-j` equals `q.answer`.
- `kb/*.json` — **not changed** (the answer-position bias is neutralised at render time; another routine edits kb/).

## ما تغيّر (What changed)

1. **Shuffled choices.** Each MCQ is rendered in an order fixed by `S5.kb.order(choices.length, lessonId|viewNonce|k)`
   (FNV-1a + murmur3 finaliser → Park-Miller). `data-j` keeps the stored index, grading still compares `j === q.answer`,
   and the "show the right answer" highlight looks the button up by `data-j` (it used the child position before).
   The nonce is made once per lesson view (`S5.lessonView`, keyed by the route object): a re-render keeps the order,
   opening the lesson again reshuffles it. `S5.hashSeed` from M2 is not used, so M1 does not depend on M2.
2. **Self-check is E0.** The lesson score is `correct MCQ / MCQ count`, saved when every MCQ is answered. Short answers
   show a "self-check — not counted in the lesson score" label; "I got it / Not yet" never change the score, the
   Leitner box, `due` or `at`. Their rating is kept on the tutorProg entry as `self: {ok, n, tier: "E0"}` (additive).
3. **Program/year filter.** `forSubject(name, {program, year})` (program `'both'` lessons belong to either). The subject
   cards (Start/Continue), the `i/N` counter and "Next lesson" use the lesson's own program and year.
   `forSubject(name)` without options behaves as before.
4. **Library offline + retry.** sw.js precaches `./kb/library.json` (cache name is per build, so a new build refreshes
   it). A failed fetch is not kept for the session: topics stay `[]` with `S5.kb.failed`, the Lessons/Review tabs show
   "The library could not be loaded — check the connection" with **Try again**, and the next `load()` call fetches
   again (no fetch loop: the screen does not refetch for 4 s after a failure).
5. **Progress in backups.** `body.progress = {tutorProg, studioProg}`. Restore (merge and replace) merges per lesson id:
   the entry with the newer `at` wins; studio `passed` stays true and `best` keeps the higher score (studio.js keeps
   them monotonic); studio `_errs` counters keep the larger count per habit. Backups without `progress` skip this.

## Data and recovery (بيانات واسترجاع)

- No new record type and no change to existing records → **no `SCHEMA_VERSION` bump, no migration**.
- New fields are additive: `body.progress` in backup files, `self` on tutorProg entries, `meta.progressBeforeRestore`.
- Old backups (no `progress`) verify (same checksum rule) and restore unchanged. Old app builds reading a new backup
  ignore `body.progress` (they only read records/settings/blobs), so a downgrade still restores records.
- **Recovery:** before a restore writes merged progress it stores the previous `tutorProg`/`studioProg` in
  `meta.progressBeforeRestore` (`{at, tutorProg?, studioProg?}`, only the kinds that changed). To undo a bad merge on a
  device: `await S5.store.setMeta("tutorProg", S5.store.meta.progressBeforeRestore.tutorProg)` (same for studioProg).
  Records keep using the existing pre-restore snapshot. If this build misbehaves, reverting it is safe: tutorProg and
  studioProg keep their old meta keys and shape.

## Acceptance (evidence: `tests/col-m1-integrity.mjs`, all 41 checks true)

| Criterion | Check(s) | Result |
|---|---|---|
| Display position 2 on every MCQ of the 127 all-B lessons masters < 10% (was 100%) | `allBMasteredUnder10pct` (1–4 of 127 per run; expected ≈2.7), `choicesKeepStoredIndex`, `choicesShuffled`, `orderSeededByLessonAndNonce`, `orderStableWithinView`, `orderChangesBetweenViews`, `orderUniformAndIndependent` | met |
| "I got it" alone never gives ≥ 0.8; self-check buttons do not change the score | `gotItAloneNeverScores` (all 409 lessons), `gotItBeforeMcqGivesNoScore`, `gotItDoesNotLiftScore`, `selfCheckDoesNotChangeScore`, `selfCheckLabelOnEveryShortAnswer` | met |
| `forSubject('Engineering Drawing', {program:'civil', year:1})` only c1b-draw-* in order; Next lesson stays in c1b-* | `forSubjectCivilDrawingOnly`, `forSubjectArchDrawingOnly`, `forSubjectCivilConstructionOnly`, `startButtonsStayInProgram`, `nextLessonStaysInCivil` | met |
| Built sw.js precaches /kb/library.json; failed first fetch then success loads in the same session | `builtSwShellHasLibrary`, `servedSwShellHasLibrary`, `swInstallPrecachesLibrary` (real SW install on wrangler), `failedFetchNotCached`, `retryLoadsLibrarySameSession`, `standaloneRetryAfterFailedFetch` | met |
| tutorProg/studioProg identical after backup → restore('replace') in a fresh context; old backup restores and verifies | `progressIdenticalAfterReplace`, `progressPersistsAfterReload`, `oldBackupChecksumVerifies`, `oldBackupRestoresWithoutError`, `mergeNewerAtWins`, `mergeKeepsStudioPass`, `mergeKeepsRecoveryCopy` | met |
| tutor-e2e quiz and studio-e2e still pass; zero pageerror | legacy tests re-run on ports 8800/8900; `quizAllRightScoresOne`, `zeroPageErrors` | met |

## Not in scope / follow-ups

- The KB data itself is still biased (B = 68%); rebalancing kb/*.json is left to the library routine. M9 adds the
  answer-position report.
- Progress is still device meta, now carried by backups. Moving it to records (`SCHEMA_VERSION` 4) is plan §6 decision 4.
- Lesson state (answers given) is still lost if the lesson re-renders (language toggle); unchanged behaviour.
