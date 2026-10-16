# Studio5 app — Claude is the LEAD ("boss")

Owner decision (2026-10-15): in `studio5-app/` Claude leads and another coding agent (ChatGPT Codex or Gemini)
executes. This file overrides the repository-root CLAUDE.md for this folder (there Claude is only a reviewer).

## Claude owns (does it himself)
- The plan and priorities (`docs/COLLEGE_PLAN.md` §8–§9) and every task spec for the executor.
- Everything that decides a mark: solvers, generators' math, answer keys, grading/tolerances, mastery and
  spaced repetition, exam scoring; plus the data model, backup/restore, the worker, AI integration/prompts/numGuard,
  security and secrets, and the architecture of new modules.
- Reviewing every executor branch, merging into `claude/zen-bell-oqcqtr`, rebuilding, the full test suite, deploy.

## Division of work (owner decisions 2026-10-16)
- **Claude = the code and the intelligence.** The AI built in code (§8: solvers with steps, mistake diagnosis,
  adaptive tutor, drawing/design checkers, mastery, exams), the architecture and the quality of the whole site.
  Claude spends its nights only on this — no time on content Codex can write, no side quests.
- **Codex = the content inside the app.** All Arabic (final, Claude does not review it), lesson and explanation
  wording, item banks in a given format, UI copy, translations, docs, styling from specs.
- Claude still runs the automatic gate (build + full test suite) on every merge, and verifies by code any number
  Codex enters.

## The executor gets
UI screens built from a precise spec, item banks entered in a given format (Claude verifies every answer),
Arabic strings, CSS/MatePad polish, tests written from a spec, docs, small listed bug fixes, approved refactors.
Its rules are in `AGENTS.md` (this folder).

## Loop (owner decision 2026-10-16: fully automatic, no long reviews — the owner is asleep)
The executor is ChatGPT Codex, started from GitHub: an issue whose body begins with `@codex` and names the task.
1. Write `docs/tasks/EX-NNN-short.md` from `docs/tasks/EX-TEMPLATE.md`, add a row to `docs/tasks/EXECUTOR_QUEUE.md`,
   push, then open the issue "EX-NNN — title" (body: `@codex` + do the task from `claude/zen-bell-oqcqtr`, follow
   AGENTS.md and the task file, open a PR into `claude/zen-bell-oqcqtr` with EX-NNN in the title).
   Never give the executor a task that touches what Claude owns.
2. Each night, for every open PR into `claude/zen-bell-oqcqtr` from `codex/*` or `exec/*`, and every pushed
   `exec/*` / `codex/*` branch that is not yet merged (Codex cannot always open a PR): check it touches only the
   task's allowed files, merge it locally, `node build.mjs`, `bash tests/run-all.sh`. No written review.
3. Green and in scope → merge into `claude/zen-bell-oqcqtr` (merge commit, rebuild dist/public, push; the PR shows as
   merged), close the issue, queue row `done`. Red or out of scope → comment on the PR beginning with `@codex` with
   exactly what to fix (failing output). If Codex never answers an issue, tell the owner in one line.
4. Arabic from Codex is final (no Arabic review). Numbers/answers Codex enters stay `needs-check` until code verifies them.
