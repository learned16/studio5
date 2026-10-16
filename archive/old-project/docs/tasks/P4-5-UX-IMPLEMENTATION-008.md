# P4.5-UX-IMPLEMENTATION-008 — Read-Only Study Subject Lectures Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@2d549fb`; branch: `feat/p45-readonly-study-subject-lectures`.

## Goal

Extend the already-open isolated Study subject detail with an inline, read-only
projection of that subject's canonical lectures.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-LECTURES-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-008.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is frozen `repository.listLectures({ subjectId })`.
- Preserve the returned Core order and project only `id`, `title`, `startsAt`,
  `endsAt`, and `status`.
- Titles are escaped and use `dir="auto"`; timestamps and status are rendered
  literally. No counts, rankings, next/urgency/completion inference, or writes.
- The inline projection has loading, ordered ready, empty, and recoverable
  error with Retry states.
- Close, opening another subject, and route changes invalidate stale responses.

## Out of scope

No `getLecture`, `listTasks`, mutators, Core/P3/Worker/schema/storage/backup,
Ink, file or PDF access, viewer, route cutover, Phase 5, or changes to current
Today, Study, or Library behavior outside this projection.

## Verification

Run the selected P4.5 surface lint, typecheck, tests, build, built smoke, and
the selected Core tests; then run scope, docs, test, clean-code, secret, and
diff guards.

Local verification: surface lint and typecheck PASS; surface tests 38/38 PASS;
surface build PASS; built smoke PASS; selected Core planning tests 6/6 PASS;
scope PASS against `origin/develop@2d549fb`.

## Experimental boundary and rollback

This remains an isolated experimental P4.5 surface. Replace or retire it by
removing the facade and projection without changing canonical data. Reverting
this commit removes only the UI projection; no user data is created or changed.
