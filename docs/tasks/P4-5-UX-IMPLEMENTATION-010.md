# P4.5-UX-IMPLEMENTATION-010 â€” Read-Only Study Subject Schedule Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED â€” PARENT REVIEW PENDING`

Base: `origin/develop@30f3084`. Branch: `feat/p45-readonly-study-subject-schedule`.

## Goal

Extend the already-open isolated Study subject detail with an inline, read-only
projection of that subject's canonical schedule entries.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-SCHEDULE-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-010.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is frozen `repository.listScheduleEntries({ subjectId })`.
- Preserve returned Core order and project only `id`, `dayOfWeek`, `startTime`,
  `endTime`, `effectiveFrom`, `effectiveUntil`, and `location`.
- Weekday labels are fixed English labels; all time and date values are literal.
  Location is escaped and uses `dir="auto"`.
- The inline projection has loading, ordered ready, empty, and recoverable error
  with Retry states. Close, subject switch, and route changes invalidate stale responses.

## Out of scope

No active/current/next/relative/timezone/recurrence/overlap/count/ranking
interpretation, `getScheduleEntry`, joins, mutators, Core/P3/Worker/schema/
storage/backup, Ink, route cutover, or Phase 5.

## Experimental boundary and rollback

This remains an isolated experimental P4.5 surface. Revert this task's commit
to remove only the UI projection; it creates or changes no canonical data and
needs no migration.

## Verification

Surface lint and typecheck PASS; surface tests 42/42 PASS; surface build PASS;
built smoke PASS; selected Core planning tests 6/6 PASS; scope PASS against
`origin/develop@30f3084`.
