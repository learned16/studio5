# P4.5-UX-IMPLEMENTATION-014 — Read-Only Study File Versions

## Status

`LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING`

Base: `origin/develop@f102c0e`. Branch: `feat/p45-readonly-study-file-versions`.

## Goal

Show canonical file-version metadata below an already selected Study File information detail, without opening, downloading, or reading the file.

## Requirements

- `S5-UX-FOUNDATION-001`
- `S5-UX-P45-STUDY-FILE-VERSIONS-001`

## Allowed files

- `prototype/p45-product-shell-web/**`
- `docs/tasks/P4-5-UX-IMPLEMENTATION-014.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Contract and acceptance

- The sole new read boundary is the frozen surface-local `listFileVersions({artifactId})` facade. It calls exactly `repository.listFileVersions({artifactId})`.
- Project only `id`, `versionNumber`, `mediaType`, `byteSize`, and `originalModifiedAt`, retaining the Core return order. Render media type and timestamp literally; render canonical integer byte size with no conversion or inferred units.
- The nested projection has loading, ordered ready, empty, and recoverable error with Retry. File information remains visible when the versions read fails. Retry, file Close, file selection, subject close/switch, and route changes invalidate stale responses.

## Out of scope

No file bytes/content, PDF/viewer, download, opening, links, joins, mutators, `artifactId`, file hash, storage key, hashes, byte-unit conversion, current/latest/local/availability interpretation, Core/P3/Worker/schema/storage/backup, Ink, route cutover, deployment, or Phase 5.

## Routing evidence

```yaml
role: A
work_summary: Read-only Study file versions metadata
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

This isolated experimental P4.5 surface changes no canonical data. Revert this task commit to remove only the projection; no migration is needed.

## Verification

Surface lint/typecheck/tests/build/built smoke and focused Core file-intake tests passed with the bundled Node.js runtime. Check selection, scope verification, Markdown/document, secret, diff, and applicable guard checks passed before parent delivery.
