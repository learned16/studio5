# P4.5-UX-IMPLEMENTATION-012 — Read-Only Study Subject Files Projection

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@9f9657d`. Branch: `feat/p45-readonly-study-subject-files`.

## Goal

Extend the already-open isolated Study subject detail with an inline, read-only
projection of that subject's canonical file artifacts.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-FILES-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-012.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is the frozen surface-local `listFiles({ subjectId })`
  facade. It calls exactly
  `repository.searchLibrary({ query: "", subjectId, targetKinds: ["file-artifact"], limit: 500 })`.
- Preserve returned Core order and project only `targetId`, `title`, and
  `subtitle`. Titles and subtitles are escaped and use `dir="auto"`.
- The inline projection has loading, ordered ready, empty, and recoverable error
  with Retry states. Retry, close, subject switch, and route changes invalidate
  stale responses.

## Out of scope

No click or open affordance, file bytes, PDF/viewer, file versions, artifact
links, favorites, recency, counts, joins, mutators, Core/P3/Worker/schema/
storage/backup, Ink, route cutover, or Phase 5.

## Routing evidence

```yaml
role: A
work_summary: Read-only Study subject files projection
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
selection_mode: explicit
requested_model_identifier: gpt-5.6-terra
requested_reasoning_value: medium
effective_runtime_value: NOT EXPOSED
fork_context: limited
fallback: none
owner_override: none
quality_gates_unchanged: true
```

## Experimental boundary and rollback

This remains an isolated experimental P4.5 surface. Revert this task's commit
to remove only the UI projection; it creates or changes no canonical data and
needs no migration.

## Verification

Surface lint/typecheck/tests/build/built smoke, focused Core library-search
tests, selector/scope verification, applicable guards, Markdown/document,
secret, and diff checks are required before parent delivery.
