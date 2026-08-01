# Studio5 Ink Engine — Proposed Target Contracts

## Status

This is a future boundary proposal derived from current P0 behavior. It does not create production exports, Core entities, schemas, migrations, or integration work. Names and shapes below are architectural placeholders for later task briefs and change control.

The target is a replaceable engine below experimental interfaces. Domain data and operations should remain usable without the old P0 DOM, while browser-specific input, Canvas rendering, IndexedDB, lifecycle, and download APIs stay in adapters.

## Shared contract principles

- Vector strokes are authoritative; Canvas/PNG output is a derivative.
- Stable document and revision references cross adapter boundaries explicitly.
- Document coordinates are independent of viewport and device pixels.
- No contract hard-codes academic subject names, year-one material names, or a single visual shell.
- Browser events and DOM nodes do not enter the domain model.
- Persistence failures are observable and recoverable; they do not silently discard user ink.
- Operations that change stroke identity, including segment erasing, return enough mapping information for history and artifact consumers.
- Experimental Workspace and Coach UIs may be replaced without deleting or rewriting stored ink.

## Conceptual data vocabulary

These terms describe values crossing the proposed boundaries; they are not a new schema in this task.

- `InkDocumentRef`: stable artifact/document identity supplied by Studio5.
- `InkRevisionRef`: immutable saved-revision identity supplied by the artifact store.
- `InkPoint`: finite document-space `x`, `y`, pressure/fallback result, and monotonic/event time.
- `InkStroke`: stroke ID, brush metadata, pointer provenance, and ordered points.
- `InkSnapshot`: format/version reference, document reference, layers, and vector strokes.
- `ViewportState`: bounded scale and document-to-view translation.
- `InkOperation`: semantic, undoable document change such as add stroke, replace fragments, or clear.
- `RecoveryCheckpoint`: recoverable in-progress state tied to one document reference.

## `InkInputAdapter`

### Responsibility

Translate platform input into normalized, document-space engine commands while applying the selected tool policy and palm/touch policy.

### Inputs

- Browser Pointer Events, including coalesced events where supported.
- Pointer capture/cancel lifecycle.
- Active tool and brush settings.
- Touch-drawing/palm policy.
- Current inverse viewport transform supplied by `ViewportController`.
- Document bounds.

### Outputs

- Begin/append/end/cancel stroke commands with normalized `InkPoint` samples.
- Eraser path samples with a document-space radius.
- Navigation gestures for pan, pinch, and wheel zoom.
- Ignored-input diagnostics when useful.

### Errors and exceptional outcomes

- Non-finite or out-of-bounds sample.
- Lost pointer capture or cancelled pointer.
- Unsupported event capability; must fall back from coalesced samples to the base event.
- Invalid tool configuration.
- Ambiguous multi-pointer sequence; cancel safely without committing malformed ink.

### DOM independence

The normalized command types, sample normalization, intent policy, and gesture state machine should be testable without DOM objects.

### Browser adapter boundary

DOM event registration, `PointerEvent`, `setPointerCapture`, `getCoalescedEvents`, element bounds, wheel listeners, and device-specific diagnostics remain in the browser adapter.

### Future consumers

- Unified Workspace selects document role, active tool, and palm policy while receiving the same normalized commands for Blank Canvas, Lecture Sketch, PDF Annotation, Engineering Drawing, and Assignment Drawing.
- Drawing Coach uses the same sample stream so exercise analysis observes the same ink that the user sees and saves; Coach prompts/feedback do not belong in this adapter.

## `InkDocumentModel`

### Responsibility

Own authoritative vector document state and apply validated ink operations without viewport, renderer, or storage concerns.

### Inputs

- `InkDocumentRef` and initial/new snapshot.
- Normalized stroke commands.
- Eraser replacement operations.
- Clear/restore operations.
- Explicit clock/ID providers where IDs or timestamps are generated.

### Outputs

- Current immutable/read-only `InkSnapshot` view.
- Applied `InkOperation` or change set.
- Stroke/point statistics and dirty/version marker.
- Stable mappings for removed and created stroke fragments.

### Errors and exceptional outcomes

- Unsupported format version.
- Invalid/non-finite point, pressure, or width.
- Duplicate or missing stroke/layer ID.
- Document-reference mismatch.
- Operation conflict against an unexpected model version.

### DOM independence

All model validation, state transitions, serialization-ready snapshots, statistics, and ID/change semantics must be DOM-, Canvas-, and storage-independent.

### Browser adapter boundary

None is required by the model. Browser code supplies commands, ID/clock ports, and persistence triggers.

### Future consumers

- Unified Workspace hosts one model per active artifact or page context and composes it with PDF/page/lecture/assignment references outside the model.
- Drawing Coach reads snapshots/change sets for analysis and writes only explicit engine operations; target geometry and scoring remain Coach domain data.

## `InkRenderer`

### Responsibility

Render an `InkSnapshot` through a viewport onto a replaceable surface, and optionally produce explicit derivative exports.

### Inputs

- Read-only `InkSnapshot`.
- `ViewportState`/document-to-view transform.
- Render surface dimensions and device-pixel ratio.
- Render theme/brush interpretation.
- Optional underlay/overlay render ports supplied by the workspace composition.

### Outputs

- Rendered frame and frame diagnostics.
- Dirty-region/full-frame completion signal.
- Optional PNG or other derivative bytes requested explicitly for export/preview.

### Errors and exceptional outcomes

- Missing/unavailable surface.
- Canvas/context loss.
- Invalid transform or dimensions.
- Unsupported brush/render metadata.
- Derivative export failure or memory limit.

### DOM independence

Stroke traversal, width calculation, render-command generation, clipping decisions, and transform math should be testable without a DOM Canvas.

### Browser adapter boundary

Canvas 2D/WebGL creation, DPR resize, animation frames, context APIs, `toBlob`, and visual accessibility elements remain browser adapters.

### Future consumers

- Unified Workspace composes ink with blank paper, lecture context, PDF underlays, engineering guides, or assignment overlays without altering stored strokes.
- Drawing Coach composes guide/target overlays and feedback highlights as separate render layers, never by baking them into the learner's authoritative ink.

## `ViewportController`

### Responsibility

Own bounded zoom/pan state and reversible document/view coordinate transforms independently of document content.

### Inputs

- Document bounds and surface bounds.
- Fit request and padding policy.
- Pan delta.
- Zoom factor plus focal view point.
- Pinch start/update/end gesture data.
- Min/max scale configuration.

### Outputs

- `ViewportState`.
- Document-to-view and view-to-document transforms.
- Change notification/render invalidation.
- Fit/zoom percentage diagnostics.

### Errors and exceptional outcomes

- Zero/non-finite bounds.
- Invalid scale or transform.
- Pinch update without an active gesture.
- Requested focal point outside representable coordinates.

### DOM independence

All transform, fit, clamp, focal preservation, pan, and pinch calculations must be pure/testable without an element.

### Browser adapter boundary

Reading `getBoundingClientRect`, wheel event coordinates, pointer positions, resize observation, and displaying zoom labels remain browser concerns.

### Future consumers

- Unified Workspace can retain different viewport state per canvas/PDF page while keeping ink coordinates stable.
- Drawing Coach can request fit-to-exercise or focus-to-target without rewriting strokes.

## `EraserEngine`

### Responsibility

Compute deterministic segment erasure against vector strokes and return a semantic replacement operation.

### Inputs

- Candidate strokes or a document query/index.
- Eraser path point(s) in document coordinates.
- Document-space radius and eraser policy.
- ID provider for fragments.

### Outputs

- No-op on miss.
- Removed stroke IDs.
- Replacement fragment strokes.
- Old-to-new fragment mapping suitable for undo/redo and diagnostics.

### Errors and exceptional outcomes

- Non-positive/non-finite radius.
- Invalid stroke geometry.
- Duplicate generated ID.
- Resource limit for extreme resampling/path density.

### DOM independence

Hit testing, resampling, interpolation, fragmentation, and identity mapping must be fully DOM- and Canvas-independent.

### Browser adapter boundary

Pointer sampling, cursor visualization, and conversion of a screen-size eraser to document-space radius remain in input/workspace adapters.

### Future consumers

- Unified Workspace uses the same segment semantics across all six target document roles.
- Drawing Coach can distinguish learner removal/revision from new construction through explicit eraser operations; evaluation policy stays outside the engine.

## `UndoRedoController`

### Responsibility

Track reversible semantic ink transactions and expose deterministic history transitions without owning UI controls.

### Inputs

- Committed `InkOperation` plus inverse data, or before/after model versions.
- Transaction begin/commit/cancel boundaries.
- Undo, redo, reset, and restore-baseline commands.
- Configurable memory/history limit.

### Outputs

- Operation to apply for undo or redo.
- `canUndo`, `canRedo`, depth, and current model version.
- History reset/invalidation notifications.

### Errors and exceptional outcomes

- Undo/redo on an empty stack is a safe no-op.
- Transaction/model-version mismatch.
- Invalid inverse operation.
- History resource limit; trimming policy must be explicit and observable.

### DOM independence

All stack and transaction behavior must be fully independent of buttons, dialogs, renderers, timers, and browser storage.

### Browser adapter boundary

Button state, keyboard shortcuts, gestures, and revision-preview UI remain workspace adapters.

### Future consumers

- Unified Workspace shares consistent history behavior across document roles and can define transaction boundaries for guides, layers, or page switches outside the controller.
- Drawing Coach can observe committed operations for an exercise timeline without making feedback messages part of undoable ink history.

## `InkAutosaveController`

### Responsibility

Coordinate dirty state, recovery checkpoints, debounced durable saves, lifecycle flushes, and user-visible save status through storage ports.

### Inputs

- Document/ref and applied change notifications.
- Current vector snapshot provider.
- Stroke-in-progress and eraser checkpoint events.
- Timer/clock scheduler port.
- Visibility/close/flush commands supplied by the browser adapter.
- `InkArtifactStore` draft and recovery methods.

### Outputs

- Recovery checkpoint writes.
- Debounced/forced draft commits.
- Journal clear only after the relevant durable commit succeeds.
- Save-state events such as dirty, saving, saved, recovered, degraded, and failed.

### Errors and exceptional outcomes

- Quota/storage unavailable.
- Serialization/validation failure.
- Durable commit failure while recovery data remains.
- Stale checkpoint/document-reference mismatch.
- Concurrent save ordering conflict.

### DOM independence

The autosave state machine, ordering, debounce policy, and recovery-clear rules should be testable with fake clock and storage ports.

### Browser adapter boundary

`setTimeout`, page visibility, unload/lifecycle signals, online/offline labels, and UI save indicators remain browser/workspace adapters.

### Future consumers

- Unified Workspace uses one controller per active artifact and can force a flush before page/artifact transitions.
- Drawing Coach uses the same recovery guarantees for exercise ink; scoring/feedback failures must never block local ink saving.

## `InkArtifactStore`

### Responsibility

Provide the persistence boundary for recoverable drafts and immutable, content-verified revisions without exposing IndexedDB, LocalStorage, or Core repository details to the model.

### Inputs

- `InkDocumentRef`.
- Validated vector `InkSnapshot` or serialized bytes.
- Recovery checkpoint variant.
- Save/load/list/clear/verify commands.
- Optional academic/artifact link references supplied by the calling application.

### Outputs

- Loaded draft plus source/recovery metadata.
- Durable save receipt.
- Immutable `InkRevisionRef`, revision list, duplicate result, and content digest.
- Verified revision snapshot/bytes.
- Explicit degraded-storage mode.

### Errors and exceptional outcomes

- Storage unavailable/quota exceeded/transaction aborted.
- Unsupported snapshot version.
- Corrupt JSON or content digest mismatch.
- Missing revision/content.
- Document-reference mismatch.
- Duplicate content, returned as a normal non-destructive outcome rather than an error.

### DOM independence

The port/interface, receipts, error taxonomy, vector serialization validation, and document/revision semantics must be independent of DOM and Canvas.

### Browser adapter boundary

IndexedDB, LocalStorage emergency fallback, Core browser drivers, File/Blob download APIs, and Service Worker/offline cache remain adapters. Studio5 Core remains the authority for immutable revision metadata/content contracts.

### Future consumers

- Unified Workspace persists Blank Canvas, Lecture Sketch, PDF Annotation, Engineering Drawing, and Assignment Drawing under explicit artifact/context references.
- Drawing Coach persists the same authoritative learner ink and links it to an exercise/result outside the ink schema; the Coach must not invent a parallel bitmap store.

## Proposed composition

```text
Browser events ----> InkInputAdapter ----> InkDocumentModel <----> UndoRedoController
       |                    |                    |
       |                    v                    v
       +------------> ViewportController ---> InkRenderer ---> Canvas/derivative export
                            |
                            +----------> EraserEngine

InkDocumentModel changes ---> InkAutosaveController ---> InkArtifactStore
                                                        |-- P0-compatible recovery adapter
                                                        `-- Studio5 Core revision adapter
```

Unified Workspace and Drawing Coach should depend on these boundaries through composition. Neither consumer should import the old P0 `app.mjs` or rely on its DOM IDs.

## Compatibility obligations for a later implementation

Before replacing any current path, future tasks must demonstrate parity for:

- Pressure and safe fallback.
- Palm/touch policy plus real-device behavior.
- Segment erasing.
- Undo/redo.
- Zoom/pan/pinch and coordinate stability.
- Autosave and crash recovery.
- Stable immutable revision history and safe reopen/restore.
- Vector JSON/artifact persistence and derivative export.
- No Canvas bitmap as the authoritative saved document.

These contracts are proposed boundaries only. Adoption requires separate task briefs, verification, and Device Gate evidence.
