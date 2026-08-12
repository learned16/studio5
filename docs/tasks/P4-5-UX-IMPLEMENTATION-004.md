# P4.5-UX-IMPLEMENTATION-004 — Read-Only Library Index Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

## Goal

Replace only the representative Library content in the isolated Phase 4.5
product shell with an accessible, read-only projection of the canonical Core
library index. This slice must not open resource bytes, mutate user data, change
another destination, or change the production route.

## Requirement IDs

- `S5-FR-005C-SEARCH`
- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-LIBRARY-001`

## Type and routing

- Type: `PRODUCTION UI / ISOLATED READ ADAPTER`
- Base: `origin/develop@54c4f48`
- Branch: `feat/p45-readonly-library-index`
- Parallel safety: `EXCLUSIVE` for the files listed below
- Routing classification: complex work, low ambiguity, medium production risk,
  large context, moderate architecture judgment, medium review sensitivity, and
  mixed mechanicality.
- Requested route: `R2 — deep implementation`, `gpt-5.6-sol`, high reasoning,
  inherited task context. Effective model and reasoning are `NOT EXPOSED`;
  fallback is `none`, owner override is `none`, and all quality gates remain
  unchanged.

## Dependencies and blockers

- PR #21 merged `P4.5-UX-IMPLEMENTATION-003` into `develop` as `54c4f48` after
  all five reported GitHub checks passed.
- The canonical `AcademicRepository.searchLibrary` read contract already
  exists.
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
physical browser driver reading existing user data. This task does not
implement or verify PDF opening, a PDF viewer, file-byte reads, or Notes.

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-004.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Shared files

- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Required behavior

- A surface-local facade exposes one read operation and invokes only
  `AcademicRepository.searchLibrary` after opening the canonical Core browser
  storage context.
- Library has loading, canonical-data, empty, and recoverable-error states.
- The projection preserves Core result order and identity without adding a new
  ranking, inferred activity, or user-data meaning.
- User titles and subtitles render with `dir="auto"` and hostile content is
  escaped.
- Library results use semantic list/card structure with accessible headings.
- Retry travels through the actual application listener from a controlled read
  failure to a ready state while keeping Library selected.
- Today, Study, Projects, and Practice remain behaviorally intact.
- The static build contains the closed Core module graph required by all three
  read-only facades.

## Explicit exclusions and forbidden files

- No Core, P0, P3, Worker, route-cutover, deployment, or default-route change.
- No mutator API, schema, migration, storage-profile, Backup, Restore, Ink, or
  Phase 5 change.
- No file-byte or PDF opening, viewer, Note creation, prototype-to-prototype
  import, or real-user-data seeding.
- Forbidden: every path not listed under Allowed files, including
  `packages/studio5-core/**`, `prototype/p3-lecture-capture-web/**`,
  `workers/**`, `.github/**`, schema/migration/storage/backup/Ink paths, and
  route/deployment configuration outside the isolated P4.5 surface.

## Required checks

- Studio5 check selector against `origin/develop`.
- Surface lint, typecheck, behavior tests, build, and built smoke.
- Core tests selected for the canonical `searchLibrary` integration boundary.
- Facade contract: `searchLibrary` only and no exposed mutator.
- Projection/view behavior: Core ordering/results, data/empty/error states,
  hostile content escaping, automatic direction, and accessible result cards.
- Executable built-app Today, Study, and Library transitions through actual
  failure, Retry, and escaped ready states, preserving route selection.
- Exact scope verification, clean-code/test/docs guards, documentation-link and
  secret scans, delivery-tooling tests, and `git diff --check`.
- P3 and Worker checks are not necessarily selected because neither path nor
  contract changes in this task.
- Parent-owned independent B review and mutation guard after the A commit.

## Rollback and replacement boundary

Revert this task's commit to restore representative Library content. The facade
and projection own no user data, expose no mutator, and require no migration or
recovery. The isolated Library UI remains `Experimental` and can be revised or
retired without deleting canonical Core records.

## Delivery boundary

A commits the verified local change and stops. The parent Supervisor owns B
review, push, Draft PR, CI, and the human merge gate. No automatic merge.

## Local verification evidence

- Check selector: `P4.5 + Docs`; Core was added by task-specific judgment.
- Surface lint: PASS.
- Surface typecheck: PASS (`11` modules).
- Surface behavior tests: `28/28 PASS`.
- Static build: PASS (`13` assets; `28`-module closure).
- Built smoke: PASS for five routes plus actual Today, Study, and Library
  failure/Retry/escaped-ready transitions with selected-route preservation.
- Core lint, typecheck, and regression: `100/100 PASS`.
- Studio5 delivery-tooling regression: `70/70 PASS`.
- Clean-code guard: clean.
- Test guard: clean.
- Docs guard: documented symbols, commands, paths, evidence, and boundaries
  verified.
- Scope verification: PASS (`16` changed paths, all allowed).
- Documentation-link scan, high-confidence secret scan, and
  `git diff --check`: PASS.
- Physical-browser data access and same-origin deployment are not tested or
  claimed. PDF opening/viewing, file-byte access, and Notes are not implemented
  or verified by this task.
