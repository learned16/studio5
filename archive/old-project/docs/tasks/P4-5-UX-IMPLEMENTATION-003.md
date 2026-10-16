# P4.5-UX-IMPLEMENTATION-003 — Read-Only Study Subjects Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

## Goal

Replace only the representative Study content in the isolated Phase 4.5 product
shell with an accessible, read-only projection of canonical Core subjects. This
slice must not mutate user data, change any other destination, or change the
production route.

## Requirement IDs

- `S5-FR-001`
- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-001`

## Type and routing

- Type: `PRODUCTION UI / ISOLATED READ ADAPTER`
- Base: `origin/develop@190851d`
- Branch: `feat/p45-readonly-study-subjects`
- Parallel safety: `EXCLUSIVE` for the files listed below
- Routing classification: complex work, low ambiguity, medium production risk,
  medium code/context, moderate architecture judgment, medium review/security
  sensitivity, and mixed mechanicality.
- Requested route: `R2 — deep implementation`, `gpt-5.6-sol`, high reasoning,
  inherited task context. Effective model and reasoning are `NOT EXPOSED`;
  fallback is `none`, owner override is `none`, and all quality gates remain
  unchanged.

## Dependencies and blockers

- PR #20 integrated `P4.5-UX-IMPLEMENTATION-002` into `develop` as `190851d`.
- The canonical `AcademicRepository.listSubjects` read contract already exists.
- Blockers: none.
- C is not needed because this repeats the proven surface-local read-facade and
  isolated build-closure shape. It introduces no architecture, contract,
  schema, storage, or deployment decision.
- No owner decision is required for this bounded implementation.

## Origin, device, and evidence boundary

IndexedDB is scoped to the browser origin. The isolated localhost surface and
any separate preview origin cannot read canonical records written on the P3 or
production origin. Reading those same records requires a later same-origin
hosting slice; this task does not authorize that route or deployment change.

Automated facade/projection tests and the built smoke prove application wiring
against controlled repository/browser-storage boundaries. They do not prove a
physical browser driver reading existing user data. This task claims no device,
preview-data, or production-route PASS.

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-003.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Shared files

- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Required behavior

- A surface-local facade exposes one read operation and invokes only
  `AcademicRepository.listSubjects` after opening the canonical Core browser
  storage context.
- Study has loading, canonical-data, empty, and recoverable-error states.
- The projection preserves Core subject order and renders only subject identity
  and title; it adds no scores, counts, profiles, inferred activity, or AI order.
- Subject titles render with `dir="auto"` and hostile content is escaped.
- Subject cards use semantic list/card structure with an accessible heading.
- Retry travels through the actual application listener from a controlled read
  failure to a ready state.
- Today remains behaviorally intact. Projects, Practice, and Library remain
  behaviorally unchanged.
- The static build contains the closed Core module graph needed by both
  read-only facades.

## Explicit exclusions and forbidden files

- No Core, P0, P3, Worker, route-cutover, deployment, or default-route change.
- No mutator API, schema, migration, storage-profile, Backup, Restore, Ink, or
  Phase 5 change.
- No prototype-to-prototype import and no real-user-data seeding.
- Forbidden: every path not listed under Allowed files, including
  `packages/studio5-core/**`, `prototype/p3-lecture-capture-web/**`,
  `workers/**`, `.github/**`, schema/migration/storage/backup/Ink paths, and
  route/deployment configuration outside the isolated P4.5 surface.

## Required checks

- Studio5 check selector against `origin/develop`.
- Surface lint, typecheck, behavior tests, build, and built smoke.
- Core tests selected for the canonical `listSubjects` integration boundary.
- Facade contract: `listSubjects` only and no exposed mutator.
- Projection/view behavior: Core ordering, data/empty/error states, hostile
  content escaping, automatic direction, and accessible subject cards.
- Executable built-app Study transition through actual failure, Retry, and ready
  states, with Today inputs still asserted.
- Exact scope verification, clean-code/test/docs guards, secret scan, and
  `git diff --check`.
- P3 and Worker checks are not necessarily selected because neither path nor
  contract changes in this task.
- Parent-owned independent B review and mutation guard after the A commit.

## Rollback and replacement boundary

Revert this task's commit to restore representative Study content. The facade
and projection own no user data, expose no mutator, and require no migration or
recovery. The isolated Study UI remains `Experimental` and can be revised or
retired without deleting canonical Core records.

## Delivery boundary

A commits the verified local change and stops. The parent Supervisor owns B
review, push, Draft PR, CI, and the human merge gate. No automatic merge.

## Local verification evidence

- Check selector: `P4.5 + Docs`; Core was added by task-specific judgment.
- Surface lint: PASS.
- Surface typecheck: PASS (`9` modules).
- Surface behavior tests: `22/22 PASS`.
- Static build: PASS (`11` assets; `26`-module closure).
- Built smoke: PASS for five routes plus actual Today and Study
  failure/Retry/escaped-ready transitions.
- Core regression: `100/100 PASS`.
- Clean-code guard: one duplicated canonical storage-opening rule extracted;
  final pass clean.
- Test guard: clean.
- Docs guard: documented symbols, commands, paths, and boundaries verified.
- Scope verification: PASS (`18` changed paths, all allowed).
- Secret scan and `git diff --check`: PASS.
- Physical-browser data access and same-origin deployment: not tested or claimed.
