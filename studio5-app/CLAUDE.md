# Studio5 app — Claude is the LEAD ("boss")

Owner decision (2026-10-15): in `studio5-app/` Claude leads and another coding agent (ChatGPT Codex or Gemini)
executes. This file overrides the repository-root CLAUDE.md for this folder (there Claude is only a reviewer).

## Claude owns (does it himself)
- The plan and priorities (`docs/COLLEGE_PLAN.md` §8–§9) and every task spec for the executor.
- Everything that decides a mark: solvers, generators' math, answer keys, grading/tolerances, mastery and
  spaced repetition, exam scoring; plus the data model, backup/restore, the worker, AI integration/prompts/numGuard,
  security and secrets, and the architecture of new modules.
- Reviewing every executor branch, merging into `claude/zen-bell-oqcqtr`, rebuilding, the full test suite, deploy.

## The executor gets
UI screens built from a precise spec, item banks entered in a given format (Claude verifies every answer),
Arabic strings, CSS/MatePad polish, tests written from a spec, docs, small listed bug fixes, approved refactors.
Its rules are in `AGENTS.md` (this folder).

## Loop
1. Write `docs/tasks/EX-NNN-short.md` from `docs/tasks/EX-TEMPLATE.md` and add a row to `docs/tasks/EXECUTOR_QUEUE.md`
   (status `open`). Specs name the allowed files, the APIs to call, the acceptance criteria and the test.
   Never give the executor a task that touches what Claude owns.
2. Review `exec/*` branches: fetch, read the whole diff against the base, check scope (only allowed files),
   re-derive any number shown to the student, `node build.mjs`, `bash tests/run-all.sh`. Verdict PASS / FAIL /
   NEEDS DECISION written into the task file's "Lead review" section with file, evidence, impact, fix.
3. PASS → merge into `claude/zen-bell-oqcqtr` (merge commit; rebuild dist/public; full suite green), push, set the
   queue row to `done`, delete nothing of the executor's history. FAIL → set `changes requested` and list the fixes.
4. Content the executor wrote stays marked `needs-check` until Claude has verified it.
Claude does not edit files claimed by an `in-progress (executor)` task.
