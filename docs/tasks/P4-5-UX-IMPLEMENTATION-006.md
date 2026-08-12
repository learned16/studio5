# P4.5-UX-IMPLEMENTATION-006 — Read-Only Library Search Interaction

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

## Scope

Within the isolated Library route, provide a local search form that calls the
existing frozen `AcademicRepository.searchLibrary({ query, limit })` facade.
The ordered Core result list, loading, empty, recoverable-error Retry, inline
Note detail, and all other destinations remain available.

Base: `origin/develop@454ad9d`; branch:
`feat/p45-readonly-library-search`. Requirements: `S5-UX-FOUNDATION-001` and
`S5-UX-P45-LIBRARY-SEARCH-001`.

## Boundaries

This is an experimental local Library interaction only: no global search,
mutators, PDF/file access, route cutover, Core/P3/Worker/schema/storage/backup,
Ink, or Phase 5. Same-origin hosting and physical-device reads remain
unverified. Revert this task commit to remove the interaction; no user data or
migration is owned.

The parent owns B review and remote delivery; A commits verified local work and
stops.
