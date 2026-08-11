# P4.5-UX-IMPLEMENTATION-002 — Read-Only Today Core Projection

## Status

`IN PROGRESS — LOCAL IMPLEMENTATION`

## Goal

Replace the representative Today content in the isolated Phase 4.5 product
shell with a read-only projection of the existing canonical Core Today query.
This slice must not mutate user data or change the production route.

## Requirement IDs

- `S5-FR-003`
- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-TODAY-001`

## Type and routing

- Type: `PRODUCTION UI / ISOLATED READ ADAPTER`
- Base: `origin/develop@c2991c7`
- Branch: `feat/p45-readonly-today-core-projection`
- Parallel safety: `EXCLUSIVE` for the files listed below
- Routing classification: complex work, medium ambiguity, medium production
  risk, large code/context, moderate architecture judgment, medium
  review/security sensitivity, and judgment-heavy implementation.
- Requested route: `R2 — deep implementation`, `gpt-5.6-sol`, high reasoning,
  finite context. Effective runtime is `NOT EXPOSED`; fallback is `none`, owner
  override is `none`, and all quality gates remain unchanged.

## C dependency verdict

Ink Batch 3 is not a prerequisite for this slice. The Today screen reads only
the existing canonical browser storage context and
`AcademicRepository.queryToday({ now, utcOffsetMinutes })`. It does not open a
Workspace or cross the live-Ink dependency boundary. No new architecture,
Core contract, schema, or storage decision is introduced.

## Origin and evidence boundary

IndexedDB is scoped to the browser origin. The isolated localhost surface and
any separate preview origin cannot read canonical records written on the P3 or
production origin. Reading those same records requires later same-origin
hosting; this task does not authorize that route or deployment change.

Automated facade/projection tests and the built smoke prove application wiring
against a controlled in-memory IndexedDB boundary. They do not prove a physical
browser driver reading existing user data. The Core browser-storage smoke stays
pending, and this task claims no device, preview-data, or production-route PASS.

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-002.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Required behavior

- A surface-local facade exposes one read operation and invokes only
  `AcademicRepository.queryToday` after opening the canonical Core browser
  storage context.
- The Today route supplies an explicit current instant and browser UTC offset.
- The screen has loading, real-data, empty, and recoverable-error states.
- Agenda and task ordering from Core is preserved; no scoring or AI ordering is
  added.
- User-authored Arabic, English, and mixed content renders with `dir="auto"`
  while the shell remains English LTR.
- Study, Projects, Practice, and Library remain behaviorally unchanged.
- The static build contains the closed Core module graph needed by the facade.

## Explicit exclusions

- No Core, P0, P3, Worker, route-cutover, or deployment changes.
- No mutator API, schema, migration, storage-profile, Backup, Restore, Ink, or
  Phase 5 change.
- No prototype-to-prototype import and no real-user-data seeding.

## Verification

- Surface lint, typecheck, behavior tests, build, and built smoke.
- Facade contract: `queryToday` only and no exposed mutator.
- Today projection: agenda/task order, empty/error state, timezone inputs,
  hostile-content escaping, and automatic content direction.
- Executable built-app transition from a controlled read failure through the
  actual Retry listener to a ready state, including the exact current instant
  and browser UTC offset supplied to the facade.
- Studio5 check selection and every selected native check.
- Exact scope verification, clean-code/test/docs guards, secret scan, and
  `git diff --check`.
- Parent-owned independent B review and mutation guard after the A commit.

## Delivery boundary

A commits the verified local change and stops. The parent Supervisor owns B
review, push, Draft PR, CI, and the human merge gate. No automatic merge.
