# EX-004 — Arabic of the Studio Level 2 (Freehand Drawing)

status: open
owner: executor
base: claude/zen-bell-oqcqtr
branch: exec/EX-004-studio-l2-arabic
roadmap: COLLEGE_PLAN §9 week 3 · syllabus: Arc 103 weeks 3–13

## Goal
Claude built Level 2 of the Studio (one/two-point perspective, ellipses, pottery, cylinder, oblique cube, types of lines — L11–L17) with code checkers. The teacher's
instructions (`say`, `tip`), lesson titles (`ar`), the checker notes and the board captions are a first Arabic
draft. Make them read like an Iraqi drawing lecturer talking to a first-year student: clear, warm, short.

## Read first
- AGENTS.md "You own the content inside the app".
- src/college/40-studio-l2.js (lessons L11–L14 and the checker notes), src/studio.js Level 1 for the voice.

## Allowed files
- src/college/40-studio-l2.js — **Arabic text only**
- src/i18n-ar-studio2.txt
- tests/col-ex-004-arabic-only.mjs (new)

## Do not touch
Any `${…}` expression, number, English string, regex or code. The tests `tests/col-studio-l2.mjs` look for these
words inside the notes — keep each of them in the same note: «نقطة التلاشي», «أفقي», «المستطيل N», «مدببة», «يلمس»,
«عريضة», «المحور», «متناظرتين», «ارسم», «خط مستقيم», «أدور», «تلمس», «الشريط N», «متقطع», «الفراغ أطول», «متساوية».

## Acceptance criteria
- [ ] Only Arabic text changed; the words above are still present in their notes.
- [ ] `node build.mjs` succeeds.

## Test
`tests/col-ex-004-arabic-only.mjs` — plain node, like EX-003: compare with `git show claude/zen-bell-oqcqtr:<file>`
after removing Arabic runs (/[؀-ۿ،؛؟«»]+/g) and collapsing whitespace; identical, and each
listed word still occurs in the new file. `process.exitCode = 1` otherwise.

## Executor report

## Lead review
