# Studio5 Ink Engine — Proposed Extraction Sequence

## Status and guardrails

This is a future sequence, not execution authorization. The present task performs Batch 1 only: characterization lock and documentation. It does not extract, integrate, redesign, change schema, change backup, move files, start Phase 5, or retire the current UI.

Each later batch must have its own task file, branch, reserved files, checks, review, rollback, and—when behavior reaches a real device—Device Gate evidence. The current P0 path remains available until an explicitly approved replacement passes its gates.

## Invariants for every batch

- Preserve vector strokes as the authoritative ink source; never replace them with a Canvas bitmap.
- Preserve pressure, palm rejection behavior, segment eraser, undo/redo, zoom/pan, autosave, crash recovery, revision history, and export.
- Do not silently alter existing document/revision meaning, Core schema, storage namespace, backup, or immutable content.
- Keep DOM/Canvas/Pointer/IndexedDB code in adapters and domain behavior in independently testable modules.
- Do not import one prototype UI from another; integration goes through an agreed engine/Core contract.
- Keep the old visual shell Experimental. Technical parity does not approve its design.
- Preserve user data through replacement/retirement; retirement disables an interface and does not delete its stored ink.
- Stop a batch when characterization fails. Do not weaken tests to make extraction pass.

## Batch 1 — Characterization lock

### Purpose

Record the current implementation, payloads, coupling, reusable behavior, and test seams before Warm Paper work.

### Work

- Add tests only around current exports and observable storage/Core behavior.
- Map pure logic, browser coupling, entry/exit points, and risks.
- Propose target boundaries and this extraction order.
- Record untestable private behavior as gaps instead of modifying production code.

### Verification

- Existing P0 tests.
- New characterization tests.
- P0 lint, typecheck, and build.
- Diff guard confirming only `prototype/p0-ink-web/tests/**` and `docs/ink-engine/**` changed.

### Exit condition

All checks pass and a draft PR documents covered behavior and gaps. No runtime behavior changes.

### Rollback

Remove the new test and audit documents. Production remains untouched.

## Batch 2 — Extract coordinate transforms

### Purpose

Create the first small pure seam without changing input or renderer behavior.

### Work

- Move or delegate fit, clamp, pan, focal zoom, pinch calculation, and forward/inverse transforms to a DOM-free module.
- Keep `app.mjs` as the caller and preserve its public behavior and current scale bounds.
- Inject surface/document bounds as numbers; do not pass elements or events into the pure module.

### Verification

- Existing characterization remains green.
- New table-driven tests cover fit, rect offsets, pan, wheel focal preservation, pinch, scale limits, and round-trip transforms.
- Browser smoke verifies old P0 behavior is unchanged.

### Stop/rollback

If identical inputs produce different document coordinates or visible gesture regressions, restore the old calls and keep the characterization tests. No storage changes are involved.

## Batch 3 — Extract stroke and document state

### Purpose

Create `InkDocumentModel` around current vector shapes and operations while preserving persisted bytes/meaning.

### Work

- Isolate document/stroke factories, sample normalization, append/noise behavior, statistics, and serialization validation.
- Make clock/ID providers explicit for tests.
- Define semantic add/replace/clear operations without changing current stored P0 or Core snapshot formats.
- Add adapters that translate current P0 document data into the model and back.

### Verification

- Golden vector fixtures round-trip byte/data-equivalently where compatibility requires it.
- Current P0 draft and Core revisions reopen with the same stable references and stroke content.
- No Canvas/bitmap fields appear in persisted data.

### Stop/rollback

Any format, ID, revision, or recovery mismatch blocks the batch. Retain the existing `ink-core.mjs` path until adapters prove parity.

## Batch 4 — Extract viewport controller

### Purpose

Replace private mutable viewport math with the verified `ViewportController` seam built from Batch 2 calculations.

### Work

- Own viewport state and gesture transactions outside the visual shell.
- Keep DOM rect/resize/wheel/pointer reading in a browser adapter.
- Keep viewport state out of the authoritative ink snapshot unless a separately approved persistence decision is made.

### Verification

- Unit tests for state transitions and gesture interruption.
- Browser smoke for fit, buttons, pan, wheel zoom, pinch zoom, and resize.
- Device test for MatePad pan/pinch coexistence and palm behavior.

### Stop/rollback

Switch the app composition back to the private viewport controller. Stroke and storage data remain unchanged.

## Batch 5 — Extract renderer

### Purpose

Separate vector rendering from DOM orchestration without adopting the old visual design.

### Work

- Generate/render stroke commands from snapshot plus viewport.
- Put Canvas context creation, DPR sizing, animation frames, and PNG derivative creation in a Canvas adapter.
- Support separately composed background/underlay/overlay layers; do not bake PDF, guides, or Coach feedback into strokes.

### Verification

- Render-command tests for single points, segments, pressure widths, clipping, transforms, and empty snapshots.
- Approved visual/golden checks where stable enough, plus real-device latency checks.
- JSON/Core persistence remains unchanged by rendering.

### Stop/rollback

Reattach the old `drawStroke`/render path behind the same document/viewport data. Do not convert stored vectors to images.

## Batch 6 — Extract input adapter and eraser engine

### Purpose

Separate Pointer Events and gesture wiring from normalized input commands, and make erasing a semantic document operation.

### Work

- Build DOM-free input intent/sample/gesture state logic plus a browser Pointer Events adapter.
- Preserve `getCoalescedEvents` fallback, pointer cancel/capture, one active draw pointer, touch policy, and hand-tool navigation.
- Return explicit erased-stroke to fragment mappings from `EraserEngine`.
- Keep eraser cursor/size presentation outside the engine.

### Verification

- Synthetic event-adapter tests for pen/mouse/touch/coalesced/cancel/multi-pointer sequences.
- Eraser tests for miss, trim, split, full removal, pressure interpolation, IDs, and undo inverse.
- MatePad Device Gate for pressure, palm rejection, segment eraser, latency, long session, and large stroke count.

### Stop/rollback

The old Pointer Event handlers remain selectable until device parity passes. Any palm, pressure, or eraser regression blocks integration.

## Batch 7 — Extract undo/redo, autosave, and artifact-store orchestration

### Purpose

Make the remaining accepted state transitions and data-safety behavior independently testable before a new workspace consumes the engine.

### Work

- Replace private history arrays with `UndoRedoController`, preserving current transaction meaning and explicit history-limit policy.
- Replace private timers with `InkAutosaveController` driven by clock/lifecycle/storage ports.
- Wrap the existing P0 draft/journal path and Studio5 Core revisions behind `InkArtifactStore` adapters.
- Preserve current keys/namespaces and backup behavior unless a separate migration/change-control task explicitly approves otherwise.

### Verification

- Undo/redo transition matrix: add, erase, clear, redo invalidation, limit, preview/restore, and safe no-op.
- Fake-clock autosave tests: debounce, forced flush, overlapping writes, failure, retained recovery, successful journal clear, and reopen.
- Browser IndexedDB tests for success/fallback/abort/quota where feasible.
- Core revision duplicate detection, content verification, stable references, reopen, preview, and safe restore.

### Stop/rollback

Do not switch the default composition if any recovery or revision test fails. Keep recovery data intact and restore the old controllers/adapters without deleting stores.

## Batch 8 — Integrate the new Unified Workspace

### Purpose

Compose the verified engine contracts into Warm Paper/Unified Workspace without importing or restyling the old P0 visual shell.

### Work

- Connect Workspace controls to engine interfaces, not to `app.mjs` or its DOM IDs.
- Add explicit artifact/context adapters for Blank Canvas, Lecture Sketch, PDF Annotation, Engineering Drawing, and Assignment Drawing.
- Leave Coach Exercise as a supported consumer boundary; do not start Drawing Coach Phase 5 in an engine-integration task.
- Preserve access to the old P0 path as a fallback during evaluation.

### Verification

- Contract/integration tests for each in-scope workspace role.
- Existing P0 and Core regression suites.
- Autosave/recovery/revision/export parity.
- Accessibility and browser/device tests appropriate to the new shell.
- No direct prototype-to-prototype imports.

### Stop/rollback

Disable the new workspace route/flag and return to the old P0 path. Stored vector documents and revisions remain readable by the artifact adapters.

## Batch 9 — Device Gate and controlled retirement of the old visual shell

### Purpose

Retire only the visual shell after the replacement proves behavioral and data-safety parity in real academic use.

### Required evidence

- MatePad pressure and palm rejection.
- Segment eraser and undo/redo.
- Pan/zoom/pinch and coordinate accuracy.
- Autosave, force-kill recovery, reopen, and revision restore without loss.
- Long-session and high-stroke-count performance.
- JSON/vector artifact and derivative export.
- Representative checks for all active Workspace roles.
- User decision classifying the replacement `Accepted` or `Revise`; build success alone is insufficient.

### Retirement rule

Only the old UI route/shell may be hidden or removed after approval. Existing P0 draft data, Core InkDocuments, InkRevisions, and recovery/export paths are not deleted automatically. A data migration, namespace change, or backup change requires its own approved task and recovery plan.

### Rollback

Re-enable the old route/shell while retaining the same vector data. If compatibility is uncertain, stop retirement and keep both readers available until resolved.

## Dependency and gate summary

| Batch | Depends on | Must not proceed when |
|---|---|---|
| 1. Characterization | Current `develop` behavior | Baseline checks fail or scope includes production changes |
| 2. Coordinate transforms | Batch 1 | Coordinate parity fails |
| 3. Document state | Batches 1–2 | Persisted vector meaning or IDs change silently |
| 4. Viewport | Batch 2 | Gesture/transform parity fails |
| 5. Renderer | Batches 2–4 | Visual/pressure/render parity or performance fails |
| 6. Input + eraser | Batches 3–5 | MatePad pressure, palm, eraser, or latency gate fails |
| 7. History + persistence | Batches 3–6 | Autosave/recovery/revision integrity fails |
| 8. Workspace integration | Verified contracts from Batches 2–7 | Direct old-UI coupling or any data-safety regression exists |
| 9. Retirement | Workspace Device Gate and user approval | Replacement remains Experimental/Revise or data compatibility is uncertain |

## Intended consumer coverage

The extraction should yield one reusable engine composition for:

- Blank Canvas.
- Lecture Sketch.
- PDF Annotation.
- Engineering Drawing.
- Coach Exercise when its separately authorized phase begins.
- Assignment Drawing.

Role-specific metadata, underlays, guides, targets, scoring, and submission flows remain outside the ink engine. The engine owns ink behavior and safe vector-artifact boundaries, not the whole Studio5 product.
