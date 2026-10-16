# P4.5-UX-IMPLEMENTATION-013 — Read-Only Study File Metadata Detail

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@96e76b6`. Branch: `feat/p45-readonly-study-file-metadata`.

## Goal

Allow the isolated Study subject Files projection to select a canonical file-artifact
information detail without opening, downloading, or reading file content.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-FILE-METADATA-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-013.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is the frozen surface-local `getFileArtifact(artifactId)`
  facade. It calls exactly `repository.getFileArtifact(artifactId)`.
- Project only `id`, `displayName`, `originalName`, `sourceType`, and `archivedAt`.
  User strings are escaped and use `dir="auto"`; `archivedAt` is rendered literally
  with no availability inference.
- The inline detail has loading, ready, missing, and recoverable error with Retry and
  Close states. Close, a new selection, subject switch, and route changes invalidate
  stale responses.

## Out of scope

No file bytes/content, PDF/viewer, download, opening, versions, artifact links, joins,
mutators, favorites, recency, timestamps other than `archivedAt`, counts, Core/P3/Worker/
schema/storage/backup, Ink, route cutover, deployment, or Phase 5.

## Routing evidence

```yaml
role: A
work_summary: Read-only Study file metadata detail
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

This remains an isolated experimental P4.5 surface. Revert this task's commit to
remove only the UI projection; it creates or changes no canonical data and needs no
migration.

## Verification

Surface lint/typecheck/tests/build/built smoke, focused Core file-artifact tests,
selector/scope verification, applicable guards, Markdown/document, secret, and diff
checks are required before parent delivery.
