# P4-INK-EXTRACT-002 — Extract Pure Ink Coordinate Transforms

## Classification

- Type: `PRODUCTION / BLOCKER / EXCLUSIVE`
- Batch: `2 — Extract coordinate transforms`
- Branch: `refactor/p0-ink-coordinate-transforms`
- Base: `develop@79579d92b33b60e77a4b560abe13d09e781dd380`
- Owner: Codex
- Status: `READY FOR REVIEW — LOCAL PASS / PR CI PENDING`

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

## Verification result — 2026-08-02

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

## Rollback

Revert the application delegation and remove the pure module and its tests.
There is no schema, storage, migration, or user-data change to roll back.
