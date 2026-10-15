# EX-002 — Calculus weeks 1–10 bilingual glossary (data only)

status: open
owner: executor
base: claude/zen-bell-oqcqtr
branch: exec/EX-002-calc-glossary
roadmap: COLLEGE_PLAN §9 week 1 · syllabus: TECK 102 weeks 1–10

## Goal
Exams in this college are written in English while the student thinks in Arabic. A glossary of every term in Calculus
weeks 1–10 (matrices, determinants, inverse, linear systems, lines, circles, limits, continuity) lets the app later
drill "read the English question" skills. This task is data only; nothing in the app reads it yet.

## Read first
- docs/SYLLABUS_ARCH_Y1.md — Principles of Calculus weeks 1–10.
- kb/arch-y1b.json lesson `a1b-calc-08` (matrices) and the calculus lessons `a1b-calc-01`, `a1b-calc-02` for wording.

## Allowed files
- kb/glossary-calc-y1.json (new)
- tests/col-ex-002-glossary.mjs (new; a plain node test, no browser needed)

## Do not touch
Every other file.

## Format
`[{ "id": "g-calc-001", "week": 1, "en": "square matrix", "ar": "مصفوفة مربعة", "def_en": "...", "def_ar": "...",
"example": "[1 2 ; 3 4]", "status": "needs-check" }, …]` — 60 to 90 entries, ids unique, weeks 1–10 only.

## Acceptance criteria
- [ ] Every entry has all fields; `status` is "needs-check" (the lead verifies before use).
- [ ] Definitions are one sentence, correct, at first-year level; no integration topics.
- [ ] Each week 1–10 has at least 4 entries.

## Test
`tests/col-ex-002-glossary.mjs` — parses the JSON, checks fields, unique ids, week range and per-week counts,
exits with code 1 on failure.

## Executor report

## Lead review
