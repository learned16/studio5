# Studio5 app — rules for the EXECUTOR (ChatGPT Codex — the current executor — or Gemini / any other coding agent)

These rules apply to everything under `studio5-app/` and override the repository-root AGENTS.md here.
The owner decided (2026-10-15): **Claude is the lead ("boss")**; you are the **executor**. Claude plans,
writes the task specs, owns everything that decides a mark, reviews every change and merges. You implement
the tasks Claude gives you, exactly as specified. Speak Iraqi Arabic with the owner if you talk to him.

## What you work on
- Only tasks in `docs/tasks/EXECUTOR_QUEUE.md` with `status: open` and `owner: executor`. Take the first open one,
  set it to `in-progress (executor)` in your branch, and do only that task.
- Read first: the task file `docs/tasks/EX-NNN-*.md`, `docs/COLLEGE_PLAN.md` (§8 code is the brain, §9 roadmap),
  `docs/SYLLABUS_ARCH_Y1.md` (the owner's official Year-1 Architecture syllabus) and `src/college/README.md`.
- Scope is **Architecture Year 1** (NTU Architecture and Building Techniques). Civil is frozen: never delete or
  break anything civil.

## Never (without an explicit line in your task file)
- Change anything that decides a mark: solvers, generators' math, answer keys, grading and tolerances,
  mastery / spaced-repetition logic, exam scoring — `src/college/10-problems.js`, `src/college/20-gens-*.js` and
  any `solve()` / `grade()` code. You may *call* them.
- Change the data model, record types, migrations, backup/restore, the worker (`worker/`), AI prompts, secrets.
- Add dependencies, CDNs or large assets. Delete user data. Rewrite unrelated files.
- Push to `claude/zen-bell-oqcqtr` or `main`, merge anything, or rewrite git history.
- Invent facts or numbers. Numbers/answers you enter are marked `needs-check` for Claude.

## You own the content inside the app (owner decisions 2026-10-16)
Claude builds the code and the in-code intelligence; you write the content: lessons and explanations, item banks,
UI copy, docs. You are also the Arabic authority of the project: UI strings, translations, explanations, lesson wording and the Arabic
wording of problem texts, steps and mistake messages. Claude does not review your Arabic. In generator files you may
change **only Arabic string text** (the `ar` side of `tr(lang, en, ar)` and `note(en, ar)`): never the `${…}`
expressions, numbers, English, or any code — the calculus tests (`tests/col-calc-*.mjs`) prove the math is unchanged.

## How to deliver
1. Branch from the latest `claude/zen-bell-oqcqtr` (never from `main`): `exec/EX-NNN-short-name`. If your tool names
   the branch itself (ChatGPT Codex makes `codex/…`), that is fine — put the task id `EX-NNN` in the commit message and
   in the pull-request title.
2. New code: `src/college/NN-name.js` as an IIFE attaching only to `S5.*` (the whole app is one shared script);
   register rooms/views with `S5.CAMPUS_EXTRA`, `S5.LIVE_EXTRA`, `S5.ROOT_EXTRA`. UI strings in English in code,
   Arabic in `src/i18n-ar-<task id lowercased>.txt` (English<TAB>Arabic). Keep it light for a MatePad.
3. `node build.mjs` must succeed. Write or extend the test named in the task (`tests/col-*.mjs`, reads the base
   URL from `process.env.BASE`, sets `process.exitCode = 1` on any failed check). Run it if your environment has
   Playwright/Chromium; if not, say so — Claude runs the full suite (`bash tests/run-all.sh`) on review.
   Tests that need a browser use a fixed Chromium path that only exists on Claude's machine; in your sandbox run
   `node build.mjs` and the plain-node tests named in your task (no browser).
4. Do not commit `dist/` or `public/` (Claude rebuilds on merge).
5. Fill the "Executor report" section of the task file: what you did, files changed, how you tested, anything
   unsure. Commit, push your `exec/…` branch. A draft pull request into `claude/zen-bell-oqcqtr` is fine; never into `main`.
6. If the task is unclear or needs a forbidden change, write the question in the task file, push, and stop.

Claude reviews with PASS / FAIL / NEEDS DECISION. On FAIL, fix exactly the listed findings on the same branch.

## ChatGPT Codex (cloud) — how a job starts
- In Codex pick the repository `learned16/studio5` and the branch **`claude/zen-bell-oqcqtr`** (not `main`).
- Work inside `studio5-app/`. Node 22 is enough; no `npm install` is needed for `node build.mjs` or the plain-node tests.
- One task per job. When done, push your branch and, if you can, open a PR with base `claude/zen-bell-oqcqtr`.
  If opening the PR fails (e.g. 403), just push the branch — Claude picks up pushed `exec/*` and `codex/*` branches
  every night by itself. Do not ask the owner to open it. Never merge.
