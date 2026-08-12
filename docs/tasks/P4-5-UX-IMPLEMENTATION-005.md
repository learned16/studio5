# P4.5-UX-IMPLEMENTATION-005 — Read-Only Library Note Detail Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

## Goal and requirements

Within the existing isolated Library route, allow a Note search result to open an inline, experimental, read-only detail projection. Requirements: `S5-UX-FOUNDATION-001` and `S5-UX-P45-LIBRARY-NOTE-001`.

The new surface-local facade exposes only frozen `getNote(noteId)` backed by `AcademicRepository.getNote`. Detail states are loading, ready, missing, and recoverable error with actual Retry and Close controls. Ready content renders the title, body, and optional page number escaped with `dir="auto"`.

## Boundaries

Base: `origin/develop@eebeb35`. Branch: `feat/p45-readonly-library-note-detail`. Allowed files are `prototype/p45-product-shell-web/**`, this task card, `PROJECT_STATUS.md`, and `docs/TRACEABILITY.md` only.

This is not Workspace or Notes parity: no creation, update, draft, autosave, opened/favorites/recent records, PDF/file bytes, storage/schema/Core/P3/Worker, route/deployment cutover, Projects, Practice, Ink, or Phase 5 changes. The isolated surface is origin-scoped; same-origin hosting and physical-device data access are not implemented or verified.

## Verification and rollback

Tests cover the facade-only contract and detail projection states, escaping, direction, missing/error, close, and the built app Library note failure → Retry → ready → Close flow while prior Today/Study/Library behavior and routing stay preserved. Revert this task's commit to retire the experimental projection; it owns no data and requires no migration.

The parent owns independent B review, mutation guard, remote delivery, and the human merge gate. A commits local verified work and stops.
