# OPS-AUTOPILOT-003 — Subscription-Only Supervised Delivery Validation

## Task card

- Task ID: `OPS-AUTOPILOT-003`
- Requirement: `S5-QA-AUTOPILOT-003`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `VALIDATION COMPLETE — DRAFT PR #14 / CI PASS`
- Base: `origin/develop@88f06f312efd74cb0e83ecb6e248d9f8a5ec6130`
- Branch: `chore/subscription-only-supervised-delivery`
- Dependency: `OPS-AUTOPILOT-001` complete and `OPS-AUTOPILOT-002`
  recorded as `DEFERRED BY OWNER — API AUTOMATION LATER`
- Blockers: none at task start

## Goal

Demonstrate the daily Studio5 delivery loop from one Studio5 Codex Project and
the current Codex subscription, without paid API automation or a production
behavior change. The validation must begin from live repository evidence and
end at the human merge gate after independent review, delivery, and current
GitHub CI.

## Subscription-only operating contract

1. The owner says `continue`.
2. One supervisor reconciles authority, status, tasks, Git, pull requests, and
   CI from live evidence, then selects the smallest unblocked authorized task.
3. `A — Production` implements only the task scope, runs the selected native
   checks and guards, commits, reports evidence, and stops. A does not push or
   open a Pull Request.
4. The supervisor captures the deterministic repository fingerprint outside
   the worktree, then starts an independent behaviorally no-write
   `B — Review & QA` review.
5. B reads authority, task, diff, and test evidence; reports `PASS` or `REVISE`;
   and never edits, commits, pushes, opens a Pull Request, or merges.
6. The supervisor runs `review-mutation-guard.mjs verify` and rejects the B
   verdict if the repository changed.
7. A resolves genuine `REVISE` findings inside scope, reruns checks, recommits,
   and stops; the supervisor repeats B review and mutation verification.
8. Only after B and the mutation guard pass does the supervisor push, open a
   Draft Pull Request to `develop`, inspect current GitHub CI, and return
   task-caused failures to the repair/review loop.
9. The loop stops before merge. Merge remains an owner decision.

`C — Prototype & Architecture` is available but is not started by default. It
is `NOT REQUIRED` for this validation because no architecture or research
decision is needed. C must not be invoked merely to prove that agent discovery
works.

The local B custom-agent default remains useful defense-in-depth, but B is only
behaviorally no-write when spawned beneath a writable supervisor. It is not an
enforced read-only sandbox in that runtime. Every B review therefore requires
the deterministic before/after mutation guard.

## Owner automation boundary

The owner deferred API-funded automation on 9 August 2026. This path:

- does not add or request an `OPENAI_API_KEY`;
- does not use the OpenAI API or Codex GitHub Action;
- does not use Full access or an unsafe sandbox bypass;
- does not enable automatic merge;
- does not start Phase 4.5 or Phase 5.

The stronger independently invoked, enforced read-only reviewer design remains
preserved in `OPS-AUTOPILOT-002` for a later owner-funded phase. Its deferral is
intentional and is not an error in this task.

## Allowed files

- `docs/tasks/OPS-AUTOPILOT-003.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `.agents/skills/studio5-delivery/SKILL.md`
- `.agents/skills/studio5-delivery/references/subscription-only-loop.md`
- `.agents/skills/studio5-delivery/tests/subscription-only-loop.test.mjs`

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
- Schema, storage, backup, or data meaning.
- Package manifests or lockfiles.
- GitHub workflow changes.
- Credentials or repository secrets.
- Phase 4.5, Phase 5, Full access, automatic merge, or any merge operation.

## Required checks

- `node .agents/skills/studio5-delivery/scripts/select-checks.mjs --base origin/develop`
- `node --test .agents/skills/studio5-delivery/tests/*.test.mjs`
- `node .agents/skills/studio5-delivery/scripts/verify-scope.mjs --base origin/develop` with every allowed path above
- Markdown and local-link checks from the tooling contracts
- Documentation and test guard reviews
- Secret scan of the changed files
- `git diff --check`
- The full native Core, P0, P3, and Worker regression selected because shared
  status and traceability are modified
- Independent B review and deterministic mutation-guard verification after the
  implementation commit
- Current GitHub CI on the Draft Pull Request

## Device boundary

No physical-device behavior changes in this task. No new MatePad, pen, palm
rejection, PDF, performance, or offline-device PASS is required or claimed.

## Human gate

The only delivery gate is owner approval to merge the Draft Pull Request after
all local evidence, B review, mutation verification, and GitHub CI pass. The
automation must not merge or enable automatic merge.

## Acceptance evidence

- Live Git and authority reconciliation selects this task and branch.
- A's commit contains only the allowed governance, tooling, and test files.
- Check selection and scope verification pass.
- A stops after the verified commit; the supervisor owns review and delivery.
- Independent B reports `PASS`, or a real `REVISE` finding completes a full
  repair, recheck, recommit, and rereview loop before delivery.
- The mutation guard proves B left the repository unchanged.
- Push and Draft Pull Request occur only after B and mutation verification.
- Current GitHub CI passes, with task-caused failures repaired through the same
  review loop.
- C is recorded as `NOT REQUIRED` unless a real architecture need emerges.
- No routine technical decision is delegated to the owner.
- No production behavior, API automation, Full access, automatic merge, Phase
  4.5, or Phase 5 work occurs.

## Final validation evidence — 9 August 2026

- `SUPERVISOR = PASS`: repository truth was reconciled from the current
  authority, status, task backlog, Git, PR, and CI evidence before work began.
- `A = PASS`: A changed only the authorized governance, tooling documentation,
  and contract-test files, ran the selected checks, created commit `76c6895`,
  and stopped before remote delivery.
- `B REVIEW = PASS`: an independent behaviorally no-write B reviewed the task,
  diff, and evidence without making changes. No enforced read-only sandbox is
  claimed under the writable parent.
- `B MUTATION GUARD = PASS`: the deterministic before/after repository
  fingerprint was unchanged.
- `C = AVAILABLE / NOT REQUIRED`: no architecture or research decision arose.
- `CHECK SELECTION = PASS`: the selector required Docs, Tooling, and Full
  regression for the shared governance diff.
- `SCOPE = PASS`: all six implementation-commit paths were inside the task
  allowlist, with no production, workflow, package, or lockfile change.
- `DRAFT PR = CREATED`: [PR #14](https://github.com/learned16/studio5/pull/14)
  targets `develop`; remote delivery occurred only after B and mutation checks.
- `CI = PASS`: all five current GitHub checks passed on PR #14.
- `AUTO-MERGE = DISABLED`: no merge or automatic-merge action occurred.
- `OWNER ROUTINE TECHNICAL INPUT = NOT REQUIRED`: the owner supplied only
  `continue`; the supervisor resolved routine execution choices from authority
  and repository evidence.

## Definition of Done

- [x] `SUBSCRIPTION-ONLY LOOP = end-to-end demonstrated`
- [x] `SUPERVISOR = PASS`
- [x] `A = PASS`
- [x] `B REVIEW = PASS`
- [x] `B MUTATION GUARD = PASS`
- [x] `C = AVAILABLE / NOT REQUIRED`
- [x] `CHECK SELECTION = PASS`
- [x] `SCOPE = PASS`
- [x] `CI = PASS`
- [x] `DRAFT PR = CREATED`
- [x] `AUTO-MERGE = DISABLED`
- [x] `OWNER ROUTINE TECHNICAL INPUT = NOT REQUIRED`

Validation is complete at the Draft Pull Request boundary. Merge remains the
owner's separate human gate and was not performed by this task.

## Rollback

Revert the isolated task commit or unmerged Draft Pull Request. The rollback
removes only governance, tooling documentation, and regression tests; it needs
no data migration, storage recovery, deployment rollback, or device recovery.

## Next task after success

Propose, but do not start,
`OPS-AUTOPILOT-004 — Subscription-Only Continue Control Plane`. That future
task should formalize how a simple owner `continue` request routes one governed
delivery loop from current repository truth.
