# P4.5-UX-IMPLEMENTATION-011 — Read-Only Study Subject Notes Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@b5d9980`. Branch: `feat/p45-readonly-study-subject-notes`.

## Goal

Extend the already-open isolated Study subject detail with an inline, read-only
projection of that subject's canonical notes.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-NOTES-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-011.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is frozen `repository.listNotes({ subjectId })`.
- Preserve returned Core order and project only `id`, `title`, and `body`.
- Titles and bodies are escaped and use `dir="auto"`. No timestamps, links,
  artifacts, file versions, lecture identifiers, recency, or counts are shown.
- The inline projection has loading, ordered ready, empty, and recoverable error
  with Retry states. Close, subject switch, and route changes invalidate stale
  responses.

## Out of scope

No `getNote`, note detail navigation, create/update/autosave, files, PDFs,
mutators, Core/P3/Worker/schema/storage/backup, Ink, route cutover, or Phase 5.

## Routing evidence

```yaml
role: A
work_summary: Read-only Study subject notes projection
classification:
  complexity: normal
  ambiguity: low
  production_risk: low
  code_context_volume: medium
  architecture_judgment: none
  review_security_sensitivity: medium
  mechanicality: mixed
route_profile: R1
model_capability_tier: balanced
reasoning_tier: standard
selection_mode: inherited
selected_model_identifier: NOT EXPOSED
selected_reasoning_value: NOT EXPOSED
effective_runtime_value: NOT EXPOSED
fork_context: inherited full-history
fallback: none
owner_override: none
quality_gates_unchanged: true
```

## Experimental boundary and rollback

This remains an isolated experimental P4.5 surface. Revert this task's commit
to remove only the UI projection; it creates or changes no canonical data and
needs no migration.

## Verification

Surface lint and typecheck PASS; surface tests 44/44 PASS; surface build PASS;
built smoke PASS. Selected Core Notes tests and delivery guards remain required
before delivery.
