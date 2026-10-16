# Studio5 P0 Ink Engine — Current Map

## Audit status and scope

This document maps the ink implementation on `develop` at commit `6f18b70` before any Warm Paper integration. It is a characterization and reuse audit, not a redesign approval. No production export, schema, storage namespace, visual shell, or behavior is changed by this audit.

The current implementation is a browser prototype with three practical layers:

1. `ink-core.mjs` contains reusable stroke and document calculations.
2. `storage.mjs` and `notebook-bridge.mjs` adapt vector ink data to P0 recovery storage and Studio5 Core revisions.
3. `app.mjs` owns the Canvas renderer, Pointer Events, viewport, command history, autosave scheduling, revision-preview flow, and the old visual shell in one DOM-coupled module.

The reusable asset is the vector ink behavior and its persisted stroke data. The existing visual design is not an accepted target.

## Current file inventory

| File | Current responsibility | Coupling | Reuse assessment |
|---|---|---|---|
| `prototype/p0-ink-web/ink-core.mjs` | Document/stroke factories, pressure fallback, sample append/noise threshold, client-to-document coordinate conversion, input intent, pressure width, segment distance/hit testing, segment erasing, schema-v1 loading, journal merge, statistics, export manifest | No DOM or Canvas. Uses `crypto.randomUUID`, `Date.now`, `Math`, and `structuredClone` | Strongest extraction candidate. Most functions are pure; factories have ID/time dependencies |
| `prototype/p0-ink-web/storage.mjs` | P0 draft load/save, IndexedDB document store, LocalStorage fallback, and emergency stroke/delete/snapshot journal | Browser `indexedDB`, `localStorage`; fixed database/store/keys; imports ink-core migration/recovery | Reuse behavior and payload meaning, but place access behind a storage port before Workspace integration |
| `prototype/p0-ink-web/notebook-bridge.mjs` | Creates/reuses demo academic context; saves immutable Core InkRevision snapshots; lists/loads/restores revisions | Studio5 `AcademicRepository`; contains demo-specific labels/profile key and placement creation | Revision adapter behavior is reusable. Demo bootstrap policy is not a general ink-domain contract |
| `prototype/p0-ink-web/core-runtime.mjs` | Builds the browser repository using Core IndexedDB drivers/content store and opens the notebook demo | Browser IndexedDB through Studio5 Core adapters | Browser composition root only; not ink logic |
| `prototype/p0-ink-web/app.mjs` | Entire runtime controller: DOM lookup, mutable state, drawing lifecycle, coalesced samples, Canvas rendering, pan/zoom/pinch, segment eraser orchestration, undo/redo, autosave timers, revision preview/restore, exports, diagnostics, boot | Strong DOM, Canvas 2D, Pointer Events, lifecycle, timers, Blob/URL, navigator, service worker, storage, and Core coupling | Preserve observed behavior, not module shape. It must be separated in later tasks before reuse |
| `prototype/p0-ink-web/index.html` | Old experimental P0 shell and all runtime control/dialog elements | DOM structure expected directly by `app.mjs` | Do not carry visual design into Warm Paper |
| `prototype/p0-ink-web/styles.css` | Old visual shell and control/canvas presentation | DOM class/id structure | Not an engine asset |
| `prototype/p0-ink-web/manifest.webmanifest` | PWA metadata | Browser/PWA | Deployment concern, not engine behavior |
| `prototype/p0-ink-web/sw.js` | Static offline cache for P0 and copied Core assets | Service Worker, Cache API, network fetch | Preserve offline outcome; do not treat cache code as ink engine |
| `prototype/p0-ink-web/worker/index.mjs` | Cloudflare/static-asset request entry | Worker runtime and `env.ASSETS` | Hosting adapter only |
| `prototype/p0-ink-web/server.mjs` | Local static server and `/core/` source route | Node filesystem/HTTP | Development adapter only |
| `prototype/p0-ink-web/scripts/typecheck.mjs` | Static module-shape/tab check | Node filesystem | Verification tooling; it is not a semantic type checker |
| `prototype/p0-ink-web/scripts/verify-build.mjs` | Builds static distribution and copies Studio5 Core sources | Node filesystem | Build verification only |
| `prototype/p0-ink-web/tests/ink-core.test.mjs` | Existing unit coverage for pressure, points, coordinates, intent, eraser, recovery, migration, and manifest | Node test runner | Existing behavior lock |
| `prototype/p0-ink-web/tests/notebook-bridge.test.mjs` | Existing demo bootstrap/revision behavior | Studio5 Core memory adapters | Existing integration behavior lock |
| `prototype/p0-ink-web/tests/worker.test.mjs` | Existing static root-route smoke test | Worker/Request/Response | Hosting smoke lock |
| `prototype/p0-ink-web/tests/ink-engine-characterization.test.mjs` | Additional characterization of vector payloads, recovery, storage fallback, Core round-trip, and stable reopen references | Node test runner plus Core memory adapters | Audit-only behavior lock added by this task |

Build output contains copied `core/**` modules, but their source of truth remains `packages/studio5-core/src/**`. They are consumers/dependencies of the P0 bridge, not P0 ink-engine source files.

## Pure and mostly pure logic

The following exported operations in `ink-core.mjs` are DOM-independent:

- Pure calculations: `clamp`, `pressureOrDefault`, `pointToDocument`, `pointerIntent`, `widthForPoint`, `distanceToSegment`, `strokeHits`, `documentStats`, and `exportManifest` when given an explicit time.
- Deterministic state transformations with cloning/allocation: `appendPoint`, `eraseStrokeAt`, `migrateDocument`, and `mergePendingOperation`.
- Factories with ambient dependencies: `createDocument` uses a supplied/default clock; `createStroke` uses the clock and `createId`; `createId` uses global crypto or time/random fallback.

`eraseStrokeAt` currently resamples a hit stroke, removes samples inside the eraser radius, and returns zero, one, or multiple vector fragments. New fragment IDs are generated. A miss returns the original stroke object unchanged.

`notebook-bridge.mjs` has DOM-independent orchestration, but it is not pure: every useful operation calls an `AcademicRepository`. Its `save` and `loadRevision` boundaries pass cloned stroke arrays rather than Canvas pixels.

## DOM and browser coupling

### Pointer Events

`app.mjs` directly owns:

- `pointerdown`, `pointermove`, `pointerup`, and `pointercancel` listeners.
- Pointer capture and active pointer IDs.
- `getCoalescedEvents()` consumption with single-event fallback.
- Tool-to-intent dispatch through `pointerIntent`.
- Touch suppression unless touch drawing is explicitly enabled.
- Hand-tool pan and two-touch pinch tracking.
- Pen pressure observation used by diagnostics.

The palm-rejection behavior is currently a policy rule, not a hardware recognizer: touch drawing is ignored when disabled, except the hand tool may navigate. Device-level palm rejection and Huawei pressure remain Device Gate behaviors.

### Canvas

`app.mjs` directly owns:

- Canvas 2D context creation and device-pixel-ratio resize.
- Stroke rasterization from vector points and pressure-derived widths.
- Viewport clipping, paper fill, shadow, and background.
- animation-frame scheduling and frame-duration diagnostics.
- PNG derivative export using a separate Canvas and `toBlob`.

The Canvas is a renderer and export surface only. Autosave, crash journal, JSON export, and Core revisions store vector stroke data; they do not store a Canvas bitmap as the authoritative document.

### Viewport

The persisted document points are in document coordinates. `pointToDocument` removes the canvas rect offset and inverse-applies `viewport.x`, `viewport.y`, and `viewport.scale`. Pan, wheel zoom, fit, and pinch mutate a private `viewport` object in `app.mjs`; the viewport is not written to the ink document or revision snapshots.

### Undo/redo and preview state

`history` and `future` are private arrays of cloned stroke arrays in `app.mjs`. `pushHistory` clears redo and caps undo history at 60 entries. Undo/redo restores stroke arrays and schedules render/autosave. Revision preview additionally snapshots and restores both stacks. These transitions cannot be imported for Node characterization without either executing the entire DOM application or changing production exports.

## Storage and Core coupling

### P0 draft/autosave path

- Stable P0 draft reference: document ID `p0-current`.
- IndexedDB database: `studio5-p0`, version 1.
- IndexedDB object store: `documents`, keyed by `id`.
- LocalStorage fallback key: `studio5-p0-document`.
- Emergency journal key: `studio5-p0-journal`.
- Draft payload: the whole schema-v1 document with dimensions, timestamps, and `strokes[]`.
- Journal payload variants: `stroke`, `delete`, or `snapshot`, each tied to a `documentId` and `savedAt`.

`saveDocument` writes the LocalStorage fallback first, then attempts IndexedDB. `loadDocument` prefers IndexedDB; when IndexedDB cannot be read it uses the fallback. It then migrates the document and merges the emergency journal.

### Immutable revision path

`notebook-bridge.mjs` passes strokes to `AcademicRepository.saveInkRevision`. Studio5 Core normalizes them into an ink snapshot containing `formatVersion`, stable `documentId`, layers, and strokes; serializes JSON bytes; hashes the bytes with SHA-256; and stores immutable revision metadata plus content-addressed bytes. Duplicate ink content does not create another revision.

The P0 draft (`p0-current`) and the Core InkDocument use different identifiers and persistence paths. `notebook-bridge.mjs` is the current translation boundary.

## Current inputs and outputs

| Area | Inputs | Outputs / side effects |
|---|---|---|
| Stroke creation | Color, base width, pointer type, time; normalized document-coordinate samples | Vector stroke with stable-for-session ID and points |
| Input routing | Selected tool, pointer type, touch-drawing policy | `draw`, `erase`, `navigate`, or `ignore` intent |
| Coordinate conversion | Client point, canvas rect, viewport transform | Document-space `{x, y}` |
| Segment eraser | Stroke, document-space point, document-space radius | Original stroke on miss or replacement fragment strokes on hit |
| Viewport | Wheel/pinch/button/resize input | Private scale/translation; render invalidation; no document mutation |
| Undo/redo | Private stroke snapshots and UI commands | Restored stroke array, opposite stack update, autosave/render |
| P0 autosave | Whole document object | LocalStorage JSON and, when available, IndexedDB record |
| Crash recovery | Stored document plus emergency journal | Merged document and `recovered` flag |
| Core revision save | Stable Core InkDocument ID plus cloned strokes | Created/duplicate result, immutable revision, count |
| Revision reopen | Revision ID | Verified Core snapshot strokes and revision metadata |
| JSON export | Manifest plus current document | Vector JSON download |
| PNG export | Current strokes | Raster derivative download; never the stored source of truth |

## Characterized behavior

Automated characterization now covers:

- Document and stroke creation shape.
- Numeric sample normalization and near-point suppression.
- Pressure fallback, lower/upper clamps, and width calculation.
- Coordinate invariance under equivalent pan/zoom transforms.
- Input intent policy for pen, mouse, touch, eraser, and hand tool.
- Stroke/document JSON serialization and schema-v1 parsing.
- Journal merge for stroke, delete, snapshot, wrong-document, deduplication, and longest pending stroke.
- Segment eraser miss, complete removal, and fragment metadata/IDs.
- LocalStorage autosave payload and all journal payload structures.
- Fallback reopen/recovery and journal clearing.
- Studio5 Core ink byte serialization/parsing with default layer normalization.
- Stable Notebook, InkDocument, and InkRevision references after repository reopen.
- The absence of Canvas bitmap/data URLs from authoritative draft and Core snapshot payloads.

## Gaps that require a later seam, not a production change in this task

The following behaviors are present but cannot be directly characterized through current exports:

- Undo/redo stack transitions, 60-entry cap, redo invalidation, and preview interaction.
- Pan, fit, wheel zoom, pinch zoom, zoom clamps, and focal-point preservation as controller operations.
- `getCoalescedEvents()` ordering, pointer capture/loss, and simultaneous pointer state.
- End-to-end palm rejection and real pen pressure on MatePad hardware.
- Canvas draw-command output, device-pixel-ratio handling, renderer clipping, and visual fidelity.
- Autosave debounce/timer ordering, visibility-triggered flush, and the exact journal-clear timing after a successful save.
- IndexedDB success, transaction abort, quota, and fallback behavior in an automated browser test.
- Boot fallback from empty P0 draft to latest Core revision.
- Revision-preview read-only enforcement and safe-restore orchestration.
- PNG/Blob download behavior and offline Service Worker behavior beyond the existing static smoke check.

Testing these without a production seam would require a large synthetic DOM/browser harness around `app.mjs`, or exposing/extracting the private controllers. This audit does neither.

## Current risks

1. **Controller concentration:** input, state, rendering, viewport, persistence scheduling, revision UI, and exports share one mutable DOM module.
2. **Private behavior seams:** key accepted behaviors cannot be imported and tested independently.
3. **Dual persistence coordination:** P0 draft save and Core immutable revision save are sequential, not one atomic transaction.
4. **Fixed P0 draft identity:** `p0-current` supports one draft namespace and is not a general multi-document artifact reference.
5. **Schema handling:** P0 schema v1 rejects unknown versions; it has no migration registry of its own.
6. **Storage semantics:** LocalStorage is written synchronously before IndexedDB; quota/write exceptions can fail the save before the IndexedDB attempt.
7. **Recovery signal:** `loadDocument` reports `recovered: true` whenever a journal parses, even if its document ID does not match and no merge occurs.
8. **Eraser identity churn:** hit strokes are resampled and receive new fragment IDs, so future semantic history must define identity/change mapping deliberately.
9. **Viewport ephemerality:** zoom/pan state is private and not persisted or shareable among workspace surfaces.
10. **Hardware dependency:** palm behavior, pressure quality, latency, and long-session performance remain device-tested outcomes, not fully reproducible Node tests.
11. **Demo bootstrap policy:** generic engine reuse must not inherit demo academic labels or automatic placement creation.
12. **Visual-shell entanglement:** `app.mjs` assumes specific element IDs and dialogs from the old UI, which Warm Paper must not adopt as an engine requirement.

## Capability preservation and future consumers

Any later extraction must preserve pressure, palm rejection policy/device behavior, segment erasing, undo/redo, zoom/pan, autosave, crash recovery, revision history, and vector plus derivative export.

The same engine boundary must support these document roles without hard-coded subject names or UI assumptions:

| Future role | Shared engine needs | Role-specific composition outside the engine |
|---|---|---|
| Blank Canvas | Full vector ink, viewport, history, save/recovery/export | Blank workspace shell |
| Lecture Sketch | Fast pen input, autosave, stable lecture link | Lecture context and capture flow |
| PDF Annotation | Coordinate stability, layers/render composition, artifact persistence | PDF page/underlay adapter and page references |
| Engineering Drawing | Precision coordinates, zoom, predictable erasing/history | Guides, scale/grid/snap tools |
| Coach Exercise | Same stroke model and renderer, stable exercise result | Prompts, targets, feedback/scoring adapters |
| Assignment Drawing | Revision-safe vector artifact and export | Assignment metadata and submission flow |

No extraction or integration is performed by this characterization task.
