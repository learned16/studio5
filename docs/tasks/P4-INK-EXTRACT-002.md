# P4-INK-EXTRACT-002 — Extract Pure Ink Coordinate Transforms

## Classification

- Type: `PRODUCTION / BLOCKER / EXCLUSIVE`
- Batch: `2 — Extract coordinate transforms`
- Branch: `refactor/p0-ink-coordinate-transforms`
- Base: `develop@79579d92b33b60e77a4b560abe13d09e781dd380`
- Owner: Codex
- Status: `LOCAL PASS / BUILD CLOSURE PASS / CI PASS / MATEPAD MULTI-TOUCH PENDING`

## Goal

Extract the current P0 viewport calculations into a pure, DOM-free module while
keeping the existing P0 interface and all observable drawing behavior unchanged.

The new module accepts only numbers and plain objects. It must not import or use
DOM, Canvas, PointerEvent, storage, Studio5 Core, timers, or browser lifecycle APIs.

## Requirements

- `S5-NFR-INK-XFORM-001`
- Related existing capability: `S5-NFR-001`

## Reserved files

- `prototype/p0-ink-web/app.mjs`
- `prototype/p0-ink-web/ink-core.mjs` only for compatibility delegation
- `prototype/p0-ink-web/ink-coordinate-transforms.mjs`
- `prototype/p0-ink-web/tests/ink-coordinate-transforms.test.mjs`
- `prototype/p0-ink-web/package.json` only when needed to lint the new module
- `prototype/p0-ink-web/scripts/typecheck.mjs` only when needed to check the new module
- `prototype/p0-ink-web/scripts/verify-build.mjs` for static import closure verification
- `prototype/p0-ink-web/scripts/benchmark-coordinate-transforms.mjs` for development evidence
- `prototype/p0-ink-web/sw.js` for the versioned shell precache
- related P0 tests
- `docs/tasks/P4-INK-EXTRACT-002.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

No other file is reserved or may be changed by this task.

## In scope

1. Fit document inside a surface using padding `34` and the current centering equations.
2. Clamp zoom/pinch scale to `0.2` through `4`.
3. Focal zoom.
4. Pan by view-space delta.
5. View/client point to document point conversion.
6. Document point to view/client point conversion.
7. Pinch initial state.
8. Pinch update preserving the current P0 focal and center-motion behavior.
9. Forward/inverse round trips.
10. Compatibility delegation for the existing `pointToDocument` export.

## Compatibility and invalid-input policy

- The extraction copies the current P0 IEEE-754/JavaScript arithmetic; it does
  not add throwing validation, coercion, fallback values, or silent repair.
- `NaN` propagation and Infinity clamping follow the current `Math.min`/
  `Math.max` behavior and are covered explicitly by tests.
- Invalid or non-positive fit dimensions retain the legacy arithmetic result.
  Fit is not newly clamped in this batch because that would change behavior on
  very small or invalid surfaces.
- Any desired hardening of those edge cases is a future change-control task.

## Invariants and exclusions

- Keep the existing `pointToDocument` name, signature, and behavior.
- Do not change InkDocument, Stroke, IDs, timestamps, pressure, palm policy,
  eraser, undo/redo, autosave, recovery, storage keys, Core revisions, renderer,
  DOM IDs, CSS, Service Worker, or deployment.
- Do not start Unified Workspace or Phase 5.
- Do not publish Ink inside the Worker.
- Do not claim MatePad validation in this task unless the user performs it.

## Acceptance criteria

1. The transform module is importable under Node and has no browser or Core dependency.
2. `app.mjs` delegates fit, zoom, pan, pinch, and coordinate conversion to it.
3. Existing P0 exports and all existing tests stay green.
4. Table-driven tests cover landscape/portrait fit, centering, padding, scale
   bounds, focal zoom, pan, inverse transforms, pinch, round trips, and invalid inputs.
5. Golden parity tests compare the new functions with frozen legacy equations.
6. P0 lint/typecheck/test/build, Core regression, P3 regression, and
   `git diff --check` pass.
7. The final diff contains only the reserved files.

## Manual local smoke

- Fit button.
- Zoom buttons.
- Mouse-wheel focal zoom.
- Hand-tool pan.
- Pinch when the local input environment supports it.
- Drawing after zoom/pan without stroke displacement.

This local smoke is not a MatePad Device Gate.

## Initial extraction verification — 2026-08-02

- New pure transform tests: `41/41 PASS`.
- Golden parity: `PASS` for fit, focal zoom, pan, inverse conversion, and pinch.
- P0 full suite: `78/78 PASS`.
- Current Ink characterization suite: `22/22 PASS`.
- P0 lint: `PASS`.
- P0 typecheck: `PASS` (`6` modules).
- P0 build: `PASS` (`9` static assets + Studio5 Core + server entrypoint).
- Studio5 Core lint/typecheck: `PASS`; tests: `100/100 PASS`.
- P3 lint/typecheck: `PASS` (`15` modules); tests: `24/24 PASS`.
- P3 build: `PASS` (`9` root assets + isolated routes + Studio5 Core).
- `git diff --check`: `PASS`.
- Local browser smoke: Fit, zoom buttons, mouse-wheel zoom, explicit hand-tool
  pan, and drawing after zoom/pan all passed without moving or losing the stroke.
- Real multi-touch pinch: `NOT RUN` because the local browser input did not
  provide a real two-touch gesture.
- MatePad validation: `NOT RUN` in this extraction task.

The existing P0 UI, storage, schema, autosave/recovery, renderer, CSS, and
deployment contracts were not changed.

## Review and QA revision — P4-INK-EXTRACT-002-FIX-1

- `ink-coordinate-transforms.mjs` is copied into `dist/assets/`.
- The build verifies the complete relative module import closure and requests
  every built module through HTTP; missing or out-of-tree imports fail the build.
- Service Worker cache `studio5-notebook-gate-v5-ink-transforms` precaches the
  extracted module and the complete imported P0 shell closure while retaining
  the existing cache-first strategy, old-cache cleanup, `skipWaiting`, and
  `clients.claim` behavior.
- `documentPointToViewInto` reuses caller-owned output objects and remains pure
  and DOM-free. The per-point function path still showed a stable large-input
  slowdown in the development benchmark, so the permitted scalar hot path is
  used by `drawStroke`: `prepareDocumentToViewTransformInto` prepares reusable
  transform scalars once per stroke, the first point is computed once, and every
  later point is computed once. A stroke with `S` segments now performs one
  module preparation call plus `S + 1` point calculations, instead of `2S`
  allocating transform calls.
- Built HTTP/browser smoke: `PASS`; the app reached the linked-notebook and
  ready states, and Fit/Zoom controls worked from `dist/assets`.
- Offline reopen: `PASS`; after one online visit and complete server shutdown,
  the built app reopened through Service Worker, allowed an Ink stroke, and
  preserved that stroke through another offline reload.

### Preserved Pinch follow-ups

The following inherited behaviors are deliberately not changed in this PR and
belong to a later Viewport/Input batch:

1. Non-zero canvas-rect focal drift.
2. Zero initial pinch distance.
3. Three-pointer replacement behavior.
4. Dragging state after pinch.

No MatePad or real multi-touch PASS is claimed by this revision.

## FIX-1 local verification — 2026-08-02

- Transform tests: `46/46 PASS`.
- Golden parity: `PASS`.
- P0 full suite: `84/84 PASS`; lint/typecheck/build: `PASS`.
- Current Ink characterization suite: `22/22 PASS`.
- Studio5 Core: `100/100 PASS` with lint/typecheck.
- P3 regression: `24/24 PASS` with lint/typecheck/static preview.
- Static build: `10` copied shell assets and `22` modules in the verified import closure.
- Wrangler `4.114.0` dry-run: `PASS`, reading `261` static assets.
- Built HTTP/browser smoke and offline reopen: `PASS`.
- `git diff --check`: `PASS`.
- GitHub Actions: `4/4 PASS` for Core, P0, P3, and Worker Static Assets.
- Cloudflare Workers Build: `PASS` for commit `7a19c39`; the existing Worker
  remains the P3 preview and does not publish or integrate P0 Ink.

Development benchmark, Node `24.14.0`, `15` alternating rounds with enough
repetitions to time at least one million segments per sample:

| Segments | Legacy inline | Extracted before FIX-1 | Optimized scalar path | Optimized vs legacy |
|---:|---:|---:|---:|---:|
| 1,000 | 5.154 ms | 4.015 ms | 2.379 ms | -53.8% |
| 10,000 | 6.260 ms | 5.645 ms | 3.429 ms | -45.2% |
| 50,000 | 9.419 ms | 7.575 ms | 5.838 ms | -38.0% |
| 100,000 | 9.590 ms | 9.601 ms | 7.319 ms | -23.7% |

Timing remains development evidence and is not a brittle CI gate. Runtime
getter counters enforce the allocation-free `S + 1` point-calculation budget;
the guard is proven by mutations that recompute either the first or final point.

## Review and QA revision — P4-INK-EXTRACT-002-FIX-2

- The former source-shape-only `drawStroke` guard was replaced by execution of
  the production function with getter-instrumented points. Empty, single-point,
  and multi-segment strokes must read every point coordinate exactly once.
- A mutation that recalculates the first point is rejected, and an independent
  mutation that recalculates the final point is rejected. The source extraction
  only loads the production function; acceptance is determined by runtime
  counters, not by matching a copied equation.
- No production seam, callback, condition, or allocation was added to the render
  loop. `app.mjs` and the transform equations are unchanged.
- Service Worker cache cleanup is scoped to the
  `studio5-notebook-gate-` namespace. Activate deletes an old P0 cache while
  preserving the current P0 cache and an unrelated experimental cache.
- Install still precaches the transform module and the complete shell. The
  cache-first fetch policy, `skipWaiting`, and `clients.claim` are unchanged.

### FIX-2 local verification — 2026-08-02

- Transform tests: `50/50 PASS`, including both mutation checks.
- P0 full suite: `91/91 PASS`; lint/typecheck/build: `PASS`.
- Service Worker tests: `5/5 PASS`.
- Current Ink characterization suite: `22/22 PASS` within the P0 full suite.
- Studio5 Core: `100/100 PASS` with lint/typecheck.
- P3 regression: `24/24 PASS` with lint/typecheck.
- Static build: `10` copied shell assets and `22` modules in the verified import closure.
- Built browser smoke: Fit/Zoom and Ink draw/save/reload `PASS`.
- Offline reopen: after complete server shutdown the built app reopened, accepted
  another stroke, saved it, and preserved both strokes through offline reload.
- No MatePad or real multi-touch PASS is claimed by FIX-2.

## Rollback

Revert the application delegation and remove the pure module and its tests.
There is no schema, storage, migration, or user-data change to roll back.
