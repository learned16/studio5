# P4.5-UX-IMPLEMENTATION-001 — Warm Paper App Shell and Navigation Foundation

## Status

`DRAFT PR #17 / OWNER VISUAL + MATEPAD HUMAN GATE PASS / B PASS / MUTATION GUARD PASS / FINAL PR-HEAD CI RECHECK PENDING`

This is the single next eligible product task after
`P4-P45-RECONCILIATION`. It is a small isolated Phase 4.5 slice, not a broad
redesign rollout.

## Goal

Build an accessible responsive Warm Paper App Shell in a new
replacement-candidate surface. Establish the five approved destinations and
representative content states without integrating production data or changing
existing prototypes.

## Requirement IDs

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-SHELL-001`

## Type and routing

- Type: `PRODUCTION UI FOUNDATION / ISOLATED REPLACEMENT CANDIDATE`
- Priority: `OWNER-PRIORITIZED / ELIGIBLE`
- Base: latest `origin/develop` after the reconciliation PR is merged
- Branch: `feat/p45-warm-paper-shell-foundation`
- Parallel safety: `EXCLUSIVE` while shared status/traceability files are owned

## Dependencies and blockers

- Requires the reconciliation PR to be merged into `develop`.
- Does not require Ink Batch 3.
- Phase 4 is `COMPLETE — AUTOMATED/CI PASS + OWNER-VERIFIED REAL-DEVICE PASS`.
  This shell task still does not perform a production route, data, Backup, or
  live-Ink cutover.
- Ink Batch 3 remains `DEFERRED / NOT STARTED`; Batches 3–7 are scheduled only
  later at the live-Ink Unified Workspace dependency boundary.
- No owner decision is required to start this bounded slice.

## Allowed implementation surface

- New isolated surface: `prototype/p45-product-shell-web/**`
- This task card.
- `PROJECT_STATUS.md` and `docs/TRACEABILITY.md` only for truthful task evidence.

The shell and navigation code are intended for reuse in the eventual
replacement path; the isolation boundary permits safe evaluation without
changing current routes or data behavior. A surface-local package manifest is
allowed only when needed for dependency-free build/test tooling and kept inside
`prototype/p45-product-shell-web/**`. Root manifests, all lockfiles, and new
external dependencies remain excluded.

## Preserved references

The following remain unchanged and runnable as references:

- `prototype/p0-ink-web/**`
- `prototype/p3-lecture-capture-web/**`
- `prototype/p45-warm-paper-shell/**`

The Warm Paper prototype is an approved visual reference only. It is not the
final product and must not be copied as an implicit production contract.

## Required product slice

- English LTR application shell.
- Exactly five primary destinations, in this order:
  `Today / Study / Projects / Practice / Library`.
- Automatic direction for user-authored Arabic, English, and mixed content
  without changing the shell direction.
- Semantic design tokens rather than hard-coded presentation contracts.
- Responsive left navigation rail for appropriate landscape widths and bottom
  navigation for narrow/portrait widths.
- Clear selected, focus, disabled, empty, and unavailable states.
- Keyboard navigation, visible focus, text labels for interactive icons,
  reduced-motion handling, and non-color-only state communication.
- Working client-side navigation among the five destinations, including reload-
  safe fallback behavior supported by the isolated surface.
- Representative content states and tests that validate real shell/navigation
  behavior without claiming live data integration. Static synthetic screens
  alone do not satisfy this slice.

## Explicit exclusions

- Core reads or writes and production adapters.
- Schema, IndexedDB, storage, migration, Backup, Restore, or Export changes.
- Ink, Ink extraction, Worker cutover, and Unified Workspace live Ink.
- Existing route migration or default-route replacement.
- Drawing Coach behavior, Phase 5, AI, or new architecture contracts.
- Deletion, retirement, or restyling of P0, P3, or the Warm Paper reference.
- Deployment or feature activation.

`Practice` is an approved destination shell only; it must not implement Phase 5.

## Required checks

- Surface-local lint, typecheck, tests, and build when defined by its manifest.
- Static contracts for exactly five primary destinations and their order.
- Static contracts for English LTR shell and automatic user-content direction.
- Responsive rail/bottom-navigation behavior checks.
- Keyboard/focus and basic accessibility checks available without a device.
- Internal-link/asset closure and executable built-app navigation smoke; actual
  browser, visual, touch, and device evidence remain a separate later gate.
- `.agents/skills/studio5-delivery/scripts/select-checks.mjs` plus all selected
  native checks.
- Exact task-scope verification, applicable code/test/docs guards, secret scan,
  and `git diff --check`.
- Independent B review with the repository mutation guard.

## Visual and device boundary

Desktop/browser visual checks prove only the implementation candidate. MatePad
landscape/portrait, touch targets, keyboard behavior, contrast, content
direction, and long-use comfort require a later device/visual gate. A build or
snapshot PASS does not approve the final design.

## Owner human-gate evidence — 2026-08-09

- The owner reviewed the isolated Phase 4.5 Warm Paper preview on MatePad and
  recorded `Owner visual review: PASS`, `MatePad review: PASS`, and
  `P4.5 human gate for this foundation: PASS`.
- This is `OWNER-VERIFIED` visual/device evidence. It is distinct from local
  automated checks, GitHub CI, and the independent B review.
- The reviewed isolated preview is
  `https://studio5-p45-human-gate-preview.44trm84.workers.dev` and exposes the
  current `prototype/p45-product-shell-web` candidate without replacing P3.
- No measurements, orientation-by-orientation checklist, touch-test details,
  or accessibility measurements are inferred beyond the owner's explicit
  PASS statements.
- Acceptance of this foundation does not authorize production route cutover,
  real-data integration, or a later Phase 4.5 slice.

## Local implementation evidence — 2026-08-09

- Added the isolated dependency-free surface at
  `prototype/p45-product-shell-web/**`; no existing prototype, Core module,
  schema, storage, Backup, Ink, Worker behavior, or production route changed.
- Surface lint and static module-boundary checks pass.
- Surface contract tests: `10/10` pass.
- Static build: `6` assets with a closed `3`-module JavaScript import graph.
- Built smoke keeps HTTP assertions limited to asset/static-fallback closure,
  then executes the built application through a dependency-free DOM harness
  across all five routes and verifies rendered headings, `aria-current`, and
  focus transitions. This is executable navigation evidence, not browser,
  visual, touch, or device evidence.
- Selected full regression passes after PR #18 reconciliation: Core `100/100`,
  P0 `91/91` plus build, P3 `24/24` plus build, Studio5 delivery tooling
  `64/64`, and Wrangler dry-run with `261` existing Worker assets.
- Exact scope, applicable code/test/docs guards, documentation/path checks,
  high-confidence secret scan, and `git diff --check` pass.

## Remote delivery evidence — 2026-08-09

- Draft PR #17 is open to `develop`; automatic merge is not enabled.
- PR #18 is merged into `develop`. The local PR #17 branch contains its merge
  commit without changing the P4.5 production-route boundary; that local
  reconciliation and the owner-gate evidence remain unpublished until the
  supervisor pushes after B PASS.
- The current live published PR #17 head is
  `7512a2ab5e1b8a941d2646d7da78bc3f29cfc111`.
- Independent B review completed `REVISE → repair → PASS`, and the repository
  mutation guard passed.
- All five reported GitHub checks succeeded on that published head: Studio5
  Core, P0 Ink Web, P3 Lecture Capture Web, Cloudflare Worker Static Assets,
  and Workers Builds: studio5.
- The owner visual/MatePad human gate is PASS on the isolated preview. This
  owner evidence does not replace the required post-reconciliation B review,
  mutation guard, or final PR-head CI.
- The first post-reconciliation B review returned `REVISE` only because the
  local reconciliation was not distinguished from the live published head.
  After repair, the repeat B review and repository mutation guard both passed.
- B routing evidence: all seven dimensions were classified as normal
  complexity, low ambiguity, low production risk, medium context, no
  architecture judgment, high review sensitivity, and judgment-heavy work.
  The Supervisor selected `R3 — assurance review`, requested the transient
  available reviewer setup `gpt-5.6-sol` with `high` reasoning and finite
  context, recorded the effective runtime as `NOT EXPOSED`, used no fallback or
  owner override, and kept all quality gates unchanged.
- The canonical delivery state remains `FINAL PR-HEAD CI RECHECK PENDING` until
  checks complete on the published reconciled branch.
- The production route remains unchanged and continues to serve P3. Phase 5
  has not started.

## Rollback and replacement boundary

Remove or disable only `prototype/p45-product-shell-web/**`. Existing P0, P3,
Warm Paper reference, Core, routes, and user data remain unchanged. No migration
or restore operation is needed.

## Human gate

The owner classified this isolated shell foundation `Accepted` after visual and
MatePad review. Merge approval remains a separate human gate. No merge, route
cutover, or expansion to data adapters follows automatically.

## Stop condition

Commit, B re-review and mutation guard, push, final PR-head CI, then stop at the
human merge gate. Do not start route cutover or the next Phase 4.5 slice
automatically.
