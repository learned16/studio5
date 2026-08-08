# OPS-AUTOPILOT-001 — Studio5 Autopilot Foundation

## Classification

- Role: `C — Prototype & Architecture`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Base: `origin/develop@ecddc229f74701e80557701cb831eb7f5cde1c6b`
- Branch: `chore/studio5-autopilot-foundation`
- Status: `LOCAL + RUNTIME VERIFICATION PASS — DRAFT PR UPDATE`

## Internal task card

| Field | Value |
|---|---|
| Task ID | `OPS-AUTOPILOT-001` |
| Goal | Make Studio5 delivery repeatable from current authority and live repository evidence through scoped implementation, independent review, Draft PR delivery, and real human gates. |
| Requirement IDs | `S5-QA-AUTOPILOT-001`; `S5-NFR-INK-XFORM-001` status reconciliation only |
| Task type | `TOOLING / GOVERNANCE / EXCLUSIVE` |
| Dependencies | Current authority; SOP; PR #10 and PR #11 integrated into `develop` |
| Blockers | None after merge-method-aware PR #11 reconciliation |
| Base | `origin/develop@ecddc229f74701e80557701cb831eb7f5cde1c6b` |
| Branch | `chore/studio5-autopilot-foundation` |
| Allowed files | `.agents/**`, `.codex/**`, `skills-lock.json`, `AGENTS.md`, `PROJECT_STATUS.md`, this task file, the deferred `OPS-AUTOPILOT-002` brief, existing Ink Batch 2 status evidence, `docs/TRACEABILITY.md`, and the extraction-sequence status introduction |
| Forbidden files | Production modules; Core; P0/P3 application code; Worker configuration; schema/storage/backup; production package manifests and package lockfiles; workflows; Unified Workspace; Drawing Coach |
| Shared files | `AGENTS.md`, `PROJECT_STATUS.md`, `docs/TRACEABILITY.md`, `.agents/**`, `.codex/**` — one writer only |
| Required checks | Skill validation; tooling syntax/tests; scope, check-selector, merge-strategy, and B mutation-guard tests; Markdown/link checks; Core/P0/P3/Worker regressions; diff check; secret scan; guard review; independent behaviorally no-write B review wrapped by the mutation guard |
| Device boundary | No new device PASS. Runtime discovery uses the corrected permission-inheritance contract below. |
| Human gates | Only the gates listed in the delivery skill; merge approval remains human. |
| Rollback | Revert this task PR's commits. No data migration or production rollback is needed. |
| Stopping point | Commit → capture repository baseline → independent behaviorally no-write B review → verify no mutation → revisions if needed → push → update Draft PR #12 → CI → task-caused repair/review loop → stop before merge. |

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
- Three project-scoped custom agents implement A, B, and C. B retains
  `sandbox_mode = "read-only"` as its default and is unconditionally forbidden
  to write by developer instructions. Current Codex live parent permission
  overrides may replace that sandbox default when B is spawned, so every B
  review is wrapped in a deterministic before/after repository mutation guard.
  A and C inherit the parent permission boundary and do not receive model pins.
- A implements, verifies, commits, and stops. The parent/supervisor obtains the
  independent B review, then owns push, Draft PR delivery, and CI handling.
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
- Parent-supervised subagents, one-writer scope, and independent behaviorally
  no-write review with deterministic mutation detection.
- Project skill metadata in `agents/openai.yaml`; it contains no tool
  dependency, credential, model pin, or secret.

The structure and runtime contract were checked against the current
[official OpenAI Subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents)
on 2026-08-08. Local subagents inherit the parent turn's current sandbox and
permission mode, and live runtime overrides are reapplied at spawn even when a
custom agent file has different defaults. Runtime discovery is not claimed
from static file checks alone, and this task does not claim enforced B
read-only isolation under a writable parent.

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
- The deferred isolated-review brief `OPS-AUTOPILOT-002`.
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
- Studio5 tooling and acceptance tests: `46/46 PASS`, including unchanged,
  tracked edit/delete, untracked create/change, ignored create/change, HEAD OID,
  symbolic HEAD, baseline-integrity, and inside-repository-output scenarios for
  the B mutation guard.
- Scope verifier: `52` changed paths checked against the task allowlist, PASS.
- Markdown/internal links: PASS within the acceptance tests.
- Script syntax: PASS for all four Node built-in scripts.
- Studio5 Core: lint/typecheck PASS; `100/100` tests PASS.
- P0 Ink: lint/typecheck/build PASS; `91/91` tests PASS.
- P3: lint/typecheck/build/static preview PASS; `24/24` tests PASS.
- Worker: static-assets build and Wrangler dry-run PASS with the repository's
  pinned `pnpm@10.34.5`.
- High-confidence secret scan: the current `52`-path task diff scanned, PASS.
- A one-time scope audit confirmed that no production package manifest or lock
  file changed; this is not encoded as a permanent branch-relative contract test.
- `git diff --check`: PASS.
- `$clean-code-guard`: fixed generic subprocess-result names, a dead closure,
  and branching in the check selector; no remaining finding.
- `$test-guard`: separated independent create/change scenarios and added
  deterministic cleanup for temporary scope-test repositories; no remaining
  behavior/mocking/bloat finding.
- `$docs-guard`: verified the OpenAI permission-inheritance claim against the
  current official Subagents page and checked the mutation-guard commands,
  flags, config fields, paths, and internal links against source; no remaining
  finding.
- Independent B review round 1: `REVISE`. B reproduced ignored-file and
  detached-HEAD gaps and identified stale evidence counts. The guard now hashes
  ignored and untracked files, records resolved and symbolic HEAD, disables Git
  optional locks, and covers each regression with a negative test. Round 2 is
  complete.
- Independent B review round 2: `PASS WITH NON-BLOCKING NOTES`. Every round-one
  finding was closed. The deterministic before/after guard returned PASS with
  an identical protected-state fingerprint. B noted that Git refs/tags and
  repository config are outside the enumerated guard boundary and that hashing
  a large ignored footprint has a measurable runtime cost; neither note blocks
  the corrected acceptance contract.

The first Worker attempt used the bundled pnpm 11 and failed because it ignored
the repository's pnpm 10 build-script allowlist. The generated untracked
workspace/package lock artifacts were removed, package hashes were rechecked,
and the required check passed with the pinned package-manager version. This was
a tooling-environment mismatch, not a production or CI regression.

## Corrected runtime discovery contract

The acceptance contract separates live discovery and behavioral safety from a
stronger sandbox guarantee that the current writable parent cannot provide:

- `Skill discovery: PASS` — `$studio5-delivery` was discovered and used in a
  new Codex session.
- `A/B/C discovery: PASS` — all three project custom agents were discovered and
  spawned successfully.
- `Config/concurrency discovery: PASS` — three concurrent subagents matched
  `.codex/config.toml`'s configured ceiling.
- `B behavioral no-write review: PASS` — B's developer instructions forbade
  mutation, and the deterministic before/after guard returned the same
  protected-state fingerprint after independent review.
- `Enforced per-subagent read-only under writable parent: CURRENT RUNTIME LIMIT / DEFERRED`
  — no enforced claim is made. Independent read-only isolation is tracked by
  `OPS-AUTOPILOT-002`.

`RUNTIME DISCOVERY: PASS (CORRECTED CONTRACT)`

Enforced isolated read-only execution is not an acceptance gate for
`OPS-AUTOPILOT-001` and remains explicitly deferred.

## Known limits

- Autopilot cannot perform unavailable physical-device validation.
- It cannot resolve subjective product decisions, grant external credentials,
  approve sensitive contract/schema changes, or authorize merge.
- Check selection is advisory. It never substitutes for task-specific judgment.
- Scope verification is diagnostic and does not replace repository permissions
  or the one-writer rule.
- The mutation guard detects final mismatches within its enumerated protected
  boundary: resolved/symbolic HEAD, porcelain status, tracked diff, and
  untracked/ignored worktree files. Other Git refs/tags and repository config
  are outside this guard. Enforced isolated read-only execution remains
  deferred to `OPS-AUTOPILOT-002`.
- Hashing a large ignored worktree footprint twice per review has a measurable
  cost and should be monitored without weakening the protected boundary.

## Rollback

Revert this task PR's commits to remove the skill, custom agents, guards, scripts,
and documentation updates. There are no production behaviors, user data,
schema versions, storage namespaces, or backups to restore.
