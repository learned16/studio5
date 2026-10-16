# OPS-QUALITY-UTF8-001 — Changed-File UTF-8/Mojibake Prevention

## Task card

- Requirement: `S5-QA-UTF8-001`
- Type: `TOOLING / QUALITY / EXCLUSIVE`
- Status: `IN PROGRESS`
- Base: `origin/develop@3fcbe553c957f045bf2a32a145a732748128f509`
- Branch: `chore/ops-quality-utf8-001`
- Dependencies: PRs #29, #30, and #33 are merged.
- Blockers: none.

## Goal and scope

Recent independent P4.5 repairs in PRs #29 (schedule), #30 (notes), and #33
(file versions) demonstrate recurring introduced mojibake. No equivalent
changed-diff delivery guard exists. Add one deterministic Node guard that
strictly validates changed text bytes and reports only newly introduced,
high-confidence mojibake or replacement-character defects.

Allowed files are `.agents/skills/studio5-delivery/scripts/**`,
`.agents/skills/studio5-delivery/tests/**`,
`.agents/skills/studio5-delivery/references/delivery-loop.md`, this card,
`PROJECT_STATUS.md`, and `docs/TRACEABILITY.md`. Product behavior, CI,
selector behavior, contracts, schema, storage, and Phase 4.5 implementation
are forbidden.

## Acceptance and evidence

- Valid ASCII, Arabic, mixed text, legitimate Latin Unicode, and valid
  typography pass.
- Added, modified, practical renamed, deleted, binary, large-context, and
  unchanged historical-content cases are deterministic.
- Intentional negative fixtures use code points, not raw accidental-looking
  malformed literals; failures include repository-relative path, line, and
  category.
- The Automation Optimization Freeze remains active; after merge, bare
  `continue` routes to the eligible Phase 4.5 product path.

## Routing and stopping point

`A`: R1 balanced — normal complexity, low ambiguity/risk, medium context,
no architecture judgment, medium review sensitivity, mixed mechanicality.
Requested `gpt-5.6-terra` / `medium`; effective runtime `NOT EXPOSED`; no
fallback; all gates unchanged. No device claim. Revert this tooling-only commit
to roll back. Stop after verified commit; supervisor owns B review and remote delivery.
