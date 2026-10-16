# P4.5-UX-IMPLEMENTATION-009 — Read-Only Study Subject Tasks Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@75aa0bd`. Branch: `feat/p45-readonly-study-subject-tasks`.

## Goal

Extend the already-open isolated Study subject detail with an inline, read-only
projection of that subject's canonical tasks.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-TASKS-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-009.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is frozen `repository.listTasks({ subjectId })`.
- Preserve the returned Core order and project only `id`, `title`, `dueAt`,
  and `status`.
- Titles are escaped and use `dir="auto"`; nullable due dates and statuses are
  displayed literally. No counts, ranks, overdue or urgency inference,
  completion controls, or writes.
- The inline projection has loading, ordered ready, empty, and recoverable
  error with Retry states.
- Close, opening another subject, and route changes invalidate stale responses.

## Out of scope

No notes, priority, `completedAt`, timestamps, mutators, Core/P3/Worker/schema/
storage/backup, Ink, file or PDF access, route cutover, or Phase 5. Existing
Today, Study, and Library behavior remains unchanged outside this projection.

## Verification

Run selected surface lint, typecheck, tests, build, built smoke, and selected
Core planning tests. Then run scope, clean-code, test, docs, secret, and diff
guards against the declared base.

Local verification: surface lint and typecheck PASS; surface tests 40/40 PASS;
surface build PASS; built smoke PASS; selected Core planning tests 5/5 PASS;
scope PASS against `origin/develop@75aa0bd`.

## Experimental boundary and rollback

This remains an isolated experimental P4.5 surface. Revert this task's commit
to remove only the UI projection; it creates or changes no canonical data and
needs no migration.
