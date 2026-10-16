# OPS-QUALITY-CI-P45-001 — P4.5 Product Shell CI Coverage

## Task card

- Requirement: `S5-QA-CI-P45-001`
- Type: `TOOLING / QUALITY / EXCLUSIVE / BLOCKER`
- Status: `IMPLEMENTED — DRAFT PR / HUMAN MERGE GATE`
- Base: `origin/develop@5547c5f`
- Branch: `claude/zen-bell-oqcqtr`
- Dependencies: PR #34 (`OPS-QUALITY-UTF8-001`) is merged.
- Blockers: none.

## Goal

`PROJECT_STATUS.md` records a material coverage finding: `.github/workflows/ci.yml`
runs Core, P0, P3, and Worker checks but has no P4.5 job, although fourteen
P4.5 slices (PRs #17–#33) are merged into `develop`. Add one independent CI job
that runs the surface's existing checks so every later P4.5 slice is gated by
GitHub checks, not only by local evidence.

## Allowed files

- `.github/workflows/ci.yml`
- `docs/tasks/OPS-QUALITY-CI-P45-001.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

Forbidden: product code, Core, P0/P3/Worker, schema, storage, contracts,
`select-checks.mjs`, package manifests and lockfiles.

## Acceptance

- New job `P4.5 Product Shell Web` uses the same pinned actions and Node 22 as
  the existing jobs and runs, in `prototype/p45-product-shell-web`:
  `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm run smoke`.
- No dependency install is needed: the surface has no dependencies and imports
  Core by relative path.
- Existing jobs are unchanged. The check count rises from 5 to 6.

## Verification (local, Node v22.22.0)

- lint: PASS
- typecheck: PASS (29 modules)
- test: 50/50 PASS
- build: PASS (31 assets, 46 modules)
- built smoke: PASS (HTTP closure, five routes, Today/Study/Library states)
- workflow YAML parses; job list: studio5-core, ink-web, p45-product-shell-web,
  lecture-capture-web, worker-static-assets.

GitHub CI evidence on the PR head is the remaining proof.

## Rollback

Revert this task commit. No data, contract, or product behavior changes.

## Stopping point

Commit + Push + Draft PR + CI. No automatic merge.
