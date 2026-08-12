# P4.5-UX-IMPLEMENTATION-007 — Read-Only Study Subject Detail Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

The isolated Study list can open an inline experimental subject detail through a frozen `AcademicRepository.getSubject` facade. It renders only title and optional code with escaping and `dir="auto"`; loading, ready, missing, recoverable Retry, and Close states are included. Request tokens prevent stale responses after Close or competing selections.

Base: `origin/develop@3d911ab`; branch: `feat/p45-readonly-study-subject-detail`. Requirements: `S5-UX-FOUNDATION-001`, `S5-UX-P45-STUDY-DETAIL-001`.

No mutators, Core/P3/Worker/schema/storage/backup/Ink/PDF/file access, route cutover, Projects, Practice, or Phase 5 are included. Same-origin and physical device reading are unverified.
