# OPS-AUTOPILOT-004 — Subscription-Only Continue Control Plane

## Task card

- Task ID: `OPS-AUTOPILOT-004`
- Requirement: `S5-QA-AUTOPILOT-004`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `VALIDATION COMPLETE — DRAFT PR #15 / CI PASS`
- Base: `origin/develop@1043d46`
- Branch: `chore/subscription-only-continue-control-plane`
- Dependency: `OPS-AUTOPILOT-003` merged through PR #14
- Blockers: none at task start

## Live reconciliation evidence — 9 August 2026

The supervisor treated the owner's bare `continue` as a control-plane command
and rebuilt state from the repository and GitHub rather than conversation
memory:

- GitHub reported PR #14 `MERGED` into `develop`, with successful checks and a
  merge commit present.
- Current `origin/develop` resolves to `1043d46`, the commit titled
  `Merge pull request #14 from learned16/chore/subscription-only-supervised-delivery`.
- The GitHub-reported merge commit is reachable from current `origin/develop`.
- `git show --stat --oneline 1043d46` contains the expected
  `OPS-AUTOPILOT-003` subscription-only validation evidence.
- The new task branch was created from that reconciled base, not from the stale
  PR #14 branch.

This uses the canonical merge-method-aware rule: GitHub PR state, reachable
merge commit, and current repository evidence prove integration. Original PR
head ancestry is not required for squash, rebase, or other history-rewriting
integration.

## Goal

Formalize and validate a bare owner `continue` as authorization for exactly one
subscription-only governed delivery loop. The supervisor must reconcile live
authority, Git, GitHub, status, tasks, and tests; route an open prior delivery
through merge approval only when it is fully green and review-clean; otherwise
resume its fixable repair loop or report its exact real blocker. Only a verified
merged delivery permits selection of the highest eligible unblocked new task.
The selected task proceeds through A, native checks and guards, independent
behavioral B review with mutation verification, Draft PR, CI, and a final human
merge gate.

`continue` does not grant product scope by itself. Authority and the selected
task card continue to define what may change.

## Allowed files

- `docs/tasks/OPS-AUTOPILOT-004.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `.agents/skills/studio5-delivery/SKILL.md`
- `.agents/skills/studio5-delivery/references/task-routing.md`
- `.agents/skills/studio5-delivery/references/continue-control-plane.md`
- `.agents/skills/studio5-delivery/assets/master-autopilot-prompt.md`
- `.agents/skills/studio5-delivery/tests/continue-control-plane.test.mjs`

## Shared files

- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `.agents/skills/studio5-delivery/**`

These files are exclusive to this task while its writer is active.

## Forbidden scope

- Production behavior or product UI.
- `packages/studio5-core/**`.
- `prototype/p0-ink-web/**`.
- `prototype/p3-lecture-capture-web/**`.
- Worker production behavior or deployment.
- Schema, storage, backup, contracts, or data meaning.
- GitHub workflows, package manifests, or lockfiles.
- OpenAI API, `OPENAI_API_KEY`, Codex GitHub Action, or paid API automation.
- Full access, unsafe bypass, automatic merge, or any merge operation.
- Phase 4.5 or Phase 5 implementation.

## Continue contract

1. Rebuild authority and implementation state from live repository and GitHub
   evidence; never route from session memory.
2. Classify the prior PR from observable evidence:
   - merged and integrated: verify merge-method-aware evidence, start from
     current `origin/develop`, and select exactly one new task;
   - open and merge-ready: require fully green CI, B and mutation-guard PASS,
     and no unresolved blocking finding, then stop for human merge approval;
   - open and repairable: resume the same task when task-caused CI, B `REVISE`,
     or another unresolved fixable finding exists, without asking for merge;
   - closed without merge or genuinely unreconciled: investigate and report the
     exact blocker, stopping only at a real human or external gate.
3. Never start a second task while the prior delivery remains open. After
   verified integration, select exactly one highest eligible unblocked task and
   resolve blockers before dependents.
4. Make routine technical choices from authority, the task card, repository
   evidence, and established contracts without asking the owner.
5. Use one writer. A implements, checks, commits, and stops before remote
   delivery.
6. The supervisor obtains independent behaviorally no-write B review and proves
   no mutation with the deterministic before/after guard.
7. Only after B and the mutation guard pass may the supervisor push, open a
   Draft PR, and inspect CI.
8. Repair task-caused findings and CI failures within scope, then repeat review
   as needed.
9. Stop before merge. Merge remains the owner's human gate.

C is available only for a real architecture, prototype, dependency, or
research need. It is not a default step and is `NOT REQUIRED` for this task.

## Required checks

- `node .agents/skills/studio5-delivery/scripts/select-checks.mjs --base origin/develop`
- `node --test .agents/skills/studio5-delivery/tests/*.test.mjs`
- `node .agents/skills/studio5-delivery/scripts/verify-scope.mjs --base origin/develop`
  with every allowed path above
- Markdown and local-link checks exercised by the tooling contracts
- Documentation and test guard reviews
- Secret scan of changed files
- `git diff --check`
- Full Core, P0, P3, and Worker regression because shared status and traceability
  files change
- Independent B review and deterministic mutation-guard verification after A's
  implementation commit
- Current GitHub CI on the Draft Pull Request

## Device boundary

No physical-device behavior changes. No new MatePad, pen, palm rejection, PDF,
performance, offline, or backup device PASS is required or claimed.

## Acceptance criteria

- A bare `continue` always begins from live authority, repository, PR, and CI
  evidence instead of remembered state.
- A merged prior delivery is verified by merge-method-aware evidence before a
  fresh branch starts from current `origin/develop`.
- An open prior delivery reaches human merge approval only when CI is fully
  green, B and mutation guard passed, and no unresolved blocking finding exists.
- An open delivery with task-caused CI failure, B `REVISE`, or another fixable
  finding resumes the same task loop without requesting merge or starting a
  second task.
- A delivery closed without merge or genuinely unreconciled is investigated and
  reports its exact blocker; it stops only at a real human or external gate.
- Exactly one highest eligible unblocked task is selected automatically.
- A cannot bypass scope, checks, commit, or its stop-before-delivery boundary.
- Push and Draft PR cannot precede independent B review and mutation-guard PASS.
- B is described accurately as behaviorally no-write under a writable parent,
  not as an enforced per-agent read-only sandbox.
- C is not started without a genuine architecture or research need.
- No API key, Codex GitHub Action, Full access, unsafe bypass, automatic merge,
  Phase 4.5, Phase 5, or Production change is introduced.
- Tooling, scope, applicable guards, native regression, B review, mutation
  guard, and GitHub CI pass before validation is marked complete.

## Acceptance evidence — 9 August 2026

- A created the scoped implementation commit `04ff732` and stopped before
  remote delivery.
- The first independent B review returned a real `HIGH / REVISE` finding about
  routing every unintegrated Pull Request to merge approval. A repaired the
  contract in `3d01c98`, reran focused evidence, and stopped again.
- The second independent B review returned `PASS`. Deterministic mutation-guard
  verification passed around both B reviews; neither review changed the
  repository.
- Tooling passed `57/57`; scope verification passed for all eight allowed paths.
- The previously selected full native evidence passed: Core `100/100`, P0
  `91/91` with build, P3 `24/24` with build, and Worker static build plus
  Wrangler dry-run.
- [Draft PR #15](https://github.com/learned16/studio5/pull/15) is open against
  `develop` at head `3d01c98cd210cfa828eff47637b9dba1576f3bb8`.
- All five current checks passed: `Studio5 Core`, `P0 Ink Web`,
  `P3 Lecture Capture Web`, `Cloudflare Worker Static Assets`, and
  `Workers Builds: studio5`.
- GitHub reports `autoMergeRequest = null`. No merge was performed.

## Current delivery truth

Validation is complete at the Draft Pull Request boundary. PR #15 remains
`OPEN` and `Draft`; it is not merged. Independent B review, both mutation-guard
verifications, local tooling and native evidence, exact scope verification, and
the five current GitHub checks passed. The active branch remains
`chore/subscription-only-continue-control-plane` until the owner decides whether
to merge.

## Human gate

The only remaining human gate is owner approval to merge Draft PR #15. The
automation must not merge or enable automatic merge.

## Rollback

Revert the isolated task Pull Request commits. The rollback removes only
governance, skill documentation, and regression tests; it requires no data,
storage, deployment, or device recovery.
