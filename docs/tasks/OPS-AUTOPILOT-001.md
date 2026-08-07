# OPS-AUTOPILOT-001 — Studio5 Autopilot Foundation

## Classification

- Role: `C — Prototype & Architecture`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Base: `origin/develop@ecddc229f74701e80557701cb831eb7f5cde1c6b`
- Branch: `chore/studio5-autopilot-foundation`
- Status: `LOCAL VERIFICATION PASS — DRAFT PR DELIVERY`

## Internal task card

| Field | Value |
|---|---|
| Task ID | `OPS-AUTOPILOT-001` |
| Goal | Make Studio5 delivery repeatable from current authority and live repository evidence through scoped implementation, independent review, Draft PR delivery, and real human gates. |
| Requirement IDs | Governance delivery loop; `S5-NFR-INK-XFORM-001` status reconciliation only |
| Task type | `TOOLING / GOVERNANCE / EXCLUSIVE` |
| Dependencies | Current authority; SOP; PR #10 and PR #11 integrated into `develop` |
| Blockers | None after merge-method-aware PR #11 reconciliation |
| Base | `origin/develop@ecddc229f74701e80557701cb831eb7f5cde1c6b` |
| Branch | `chore/studio5-autopilot-foundation` |
| Allowed files | `.agents/**`, `.codex/**`, `skills-lock.json`, `AGENTS.md`, `PROJECT_STATUS.md`, this task file, existing Ink Batch 2 status evidence, `docs/TRACEABILITY.md`, and the extraction-sequence status introduction |
| Forbidden files | Production modules; Core; P0/P3 application code; Worker configuration; schema/storage/backup; production package manifests and package lockfiles; workflows; Unified Workspace; Drawing Coach |
| Shared files | `AGENTS.md`, `PROJECT_STATUS.md`, `docs/TRACEABILITY.md`, `.agents/**`, `.codex/**` — one writer only |
| Required checks | Skill validation; tooling syntax/tests; scope and check-selector tests; merge-strategy regression tests; Markdown/link checks; Core/P0/P3/Worker regressions; diff check; secret scan; guard review; independent read-only review |
| Device boundary | No new device PASS. Runtime discovery may require a new Codex session. |
| Human gates | Only the gates listed in the delivery skill; merge approval remains human. |
| Rollback | Revert the single tooling/governance commit. No data migration or production rollback is needed. |
| Stopping point | Commit, push, Draft PR, checks, independent review, then stop without merge. |

## Why

Studio5 already has authority, task briefs, checks, and reviewer roles, but the
operator still has to reconcile live state, route work, move findings between
roles, and remember the delivery boundary manually. This task packages that
repeatable process without changing product behavior or starting the next Ink
extraction batch.

Autopilot reduces routine user intervention. It does not remove authority,
independent review, device evidence boundaries, or human gates.

## Design

- One repository skill, `$studio5-delivery`, owns freshness, task routing,
  verification selection, the A/B/C delivery loop, human gates, and reporting.
- Progressive disclosure keeps `SKILL.md` small; detailed policy lives in
  focused references and deterministic Node built-in scripts.
- Three project-scoped custom agents implement A, B, and C. B is read-only in
  both configuration and instructions. A and C inherit the parent permission
  boundary and do not receive model pins.
- A conservative three-subagent cap is a concurrency ceiling, not permission
  for parallel writing. The supervisor still defaults to one writer.
- Repository-local guard skills are reviewed and installed as a second pass;
  native tests and the independent reviewer remain authoritative evidence.

## Authority sources

1. `docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md`
2. `docs/authority/Studio5_One_Time_Full_Build_Spec_v5_AR.md`
3. `AGENTS.md` and `docs/STUDIO5_SOP.md`
4. GitHub PR state, Git history, the current tree, and tests for implementation
   evidence only

Git history never defines product scope.

## Merge-method-aware reconciliation

The preflight uses the canonical integration proof:

`GitHub PR state + merge commit reachability + current repository evidence`

For normal, squash, and rebase/history-rewriting integration, the
GitHub-reported merge commit must be reachable from the current base. The
original PR head may be useful corroboration for a normal merge, but it is
never a universal requirement. Automated regression scenarios cover all three
strategies so an unreachable original head cannot by itself produce a false
`STOP — DEVELOP NOT RECONCILED`.

## OpenAI Codex mechanisms

- Repository skills under `.agents/skills/` with progressive disclosure.
- Project custom-agent TOML files under `.codex/agents/`.
- Project `.codex/config.toml` with a conservative concurrency cap.
- Parent-supervised subagents, one-writer scope, and read-only independent
  review.
- Project skill metadata in `agents/openai.yaml`; it contains no tool
  dependency, credential, model pin, or secret.

The structure was checked against the current official Codex manual sections
for skills, custom agents, and configuration. Runtime discovery is not claimed
from static file checks alone.

## Guard skills provenance

The required source listing reported five available skills. The three selected
skills were reviewed at upstream revision
`ffa26036b7b5e77b20b5d679304a703b6fd1a43d` from
`https://github.com/amElnagdy/guard-skills` and then installed as project-local
copies for Codex:

- `.agents/skills/clean-code-guard/` — 9 files, byte-for-byte content-hash
  match with the reviewed revision.
- `.agents/skills/test-guard/` — 6 files, byte-for-byte content-hash match with
  the reviewed revision.
- `.agents/skills/docs-guard/` — 7 files, byte-for-byte content-hash match with
  the reviewed revision.

The installer-generated `skills-lock.json` records the GitHub source, skill
paths, and computed content hashes. It is tooling provenance, not a production
package lock. Package manifests and package lockfiles retained their pre-install
Git object hashes.

No production dependency, package manifest, package lockfile, WordPress guard,
WooCommerce guard, or other skill was installed.

## Files changed

- Repository status and the minimum authority-aware `AGENTS.md` routing note.
- Existing Ink Batch 2 status evidence only.
- This task brief.
- `.agents/skills/studio5-delivery/**`, the three reviewed guard skills, and
  their project-local `skills-lock.json` provenance.
- `.codex/config.toml` and the A/B/C custom-agent definitions.

No production, schema, storage, backup, production package manifest, package
lockfile, Worker, or workflow file is in scope.

## Verification record

- PR integration preflight: PR #11 `MERGED` to `develop`; GitHub merge commit
  reachable from current `origin/develop`; all reported checks successful;
  expected Batch 2 tree evidence present. Original-head ancestry was not used.
- New merge-method-aware verifier: actual PR #11 PASS; automated normal,
  squash, rebase/history-rewrite, and negative scenarios PASS.
- Skill Creator `quick_validate.py`: PASS.
- Studio5 tooling and acceptance tests: `31/31 PASS`.
- Scope verifier: `48` changed paths checked against the task allowlist, PASS.
- Markdown/internal links: PASS within the acceptance tests.
- Script syntax: PASS for all three Node built-in scripts.
- Studio5 Core: lint/typecheck PASS; `100/100` tests PASS.
- P0 Ink: lint/typecheck/build PASS; `91/91` tests PASS.
- P3: lint/typecheck/build/static preview PASS; `24/24` tests PASS.
- Worker: static-assets build and Wrangler dry-run PASS with the repository's
  pinned `pnpm@10.34.5`.
- High-confidence secret scan: `48` changed files scanned, PASS.
- Production package manifests and package lockfiles match `origin/develop`.
- `git diff --check`: PASS.
- `$clean-code-guard`: fixed generic subprocess-result names, a dead closure,
  and branching in the check selector; no remaining finding.
- `$test-guard`: separated independent negative scenarios; no remaining
  behavior/mocking/bloat finding.
- `$docs-guard`: corrected an ambiguous relative test command and a non-Windows
  continuation example; verified paths, CLI flags, config fields, and internal
  links; no remaining finding.

The first Worker attempt used the bundled pnpm 11 and failed because it ignored
the repository's pnpm 10 build-script allowlist. The generated untracked
workspace/package lock artifacts were removed, package hashes were rechecked,
and the required check passed with the pinned package-manager version. This was
a tooling-environment mismatch, not a production or CI regression.

Static success does not prove live skill or custom-agent discovery in an
already-running Codex session.

`RUNTIME DISCOVERY: PENDING NEW CODEX SESSION`

## Known limits

- Autopilot cannot perform unavailable physical-device validation.
- It cannot resolve subjective product decisions, grant external credentials,
  approve sensitive contract/schema changes, or authorize merge.
- Check selection is advisory. It never substitutes for task-specific judgment.
- Scope verification is diagnostic and does not replace repository permissions
  or the one-writer rule.

## Rollback

Revert this task's commit to remove the skill, custom agents, guards, scripts,
and documentation updates. There are no production behaviors, user data,
schema versions, storage namespaces, or backups to restore.
