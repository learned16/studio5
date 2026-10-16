# EX-003 — Polish the Arabic of the Calculus problem room

status: open
owner: executor
base: claude/zen-bell-oqcqtr
branch: exec/EX-003-calc-arabic
roadmap: COLLEGE_PLAN §9 weeks 1–2 · syllabus: TECK 102 weeks 1–16

## Goal
The Calculus problems, worked steps and mistake messages were drafted in Arabic by Claude. You are the Arabic
authority: make every Arabic string read like a clear Iraqi university lecturer (standard technical Arabic, the
terms used in Iraqi engineering colleges), short and exact.

## Read first
- AGENTS.md "You own Arabic".
- src/college/21-gens-calc.js, src/college/22-gens-deriv.js — the Arabic is the third argument of `tr(lang, en, ar)`,
  the second of `note(en, ar)`, and the `ar:` of `PR.obj({...})` objective titles and field labels.

## Allowed files
- src/college/21-gens-calc.js and src/college/22-gens-deriv.js — **Arabic text only**
- tests/col-ex-003-arabic-only.mjs (new)

## Do not touch
Any `${…}` expression, number, English string, identifier or code line. Every other file.

## Acceptance criteria
- [ ] Only Arabic characters/words inside Arabic strings changed (spaces and Arabic punctuation allowed).
- [ ] Math stays in the same `${…}` and symbols; Arabic problem texts still start with an Arabic word.
- [ ] `node build.mjs` succeeds.

## Test
`tests/col-ex-003-arabic-only.mjs` — plain node: for both files, compare with `git show claude/zen-bell-oqcqtr:<file>`;
after removing every run of Arabic letters/Arabic punctuation (/[؀-ۿ،؛؟]+/g) and collapsing
whitespace, the old and new files must be identical. `process.exitCode = 1` otherwise.

## Executor report

## Lead review
