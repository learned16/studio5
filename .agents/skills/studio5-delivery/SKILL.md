---
name: studio5-delivery
description: Orchestrate Studio5 repository work from current authority and live Git state through task selection, scoped implementation, independent review, verification, Draft PR delivery, and human gates. Use for Studio5 planning, coding, reviews, fixes, CI failures, prototypes, and selecting the next unblocked task.
---

# Studio5 Delivery

Run one governed delivery loop from fresh evidence to one clear stopping action.
Do not preserve transient repository state in this skill or infer product scope
from Git history.

## Start from truth

1. Read `AR_HERE_START.md`, `AGENTS.md`, `PROJECT_STATUS.md`, the current task
   brief, and the relevant authority and traceability documents.
2. Read [authority-and-freshness.md](references/authority-and-freshness.md).
3. Inspect the working tree and current HEAD/base. Fetch only when remote truth
   is required. For a PR task, query live PR and CI state.
4. Reconcile status drift: authority controls scope and decisions; GitHub, Git,
   the current tree, and tests prove implementation state.
5. For a merged PR, use merge-method-aware integration evidence. Never require
   original-head ancestry as a universal proof.

## Route the work

For a bare owner `continue`, first read
[continue-control-plane.md](references/continue-control-plane.md). Then read
[task-routing.md](references/task-routing.md). Select the highest-priority
uncompleted, unblocked requirement nearest the current critical path. Build the
internal task card before implementation. Do not ask the user to choose among
ordinary technical tasks.

Default to one writer. Use the project A/B/C custom agents only when their role
is useful. Do not start all three automatically, and do not assign shared files
to parallel writers.

Before every A, B, or C spawn, read
[adaptive-model-routing.md](references/adaptive-model-routing.md), classify the
work, select the lowest sufficient available capability and reasoning tier, and
record truthful routing evidence. Do not globally pin a model or reasoning
effort. Preserve every quality gate regardless of the selected tier.

## Deliver

When API-funded automation is owner-deferred, first read
[subscription-only-loop.md](references/subscription-only-loop.md). Then read
[delivery-loop.md](references/delivery-loop.md) and:

1. Implement the smallest authorized change, using A only for production work.
2. Run native lint, typecheck, tests, and build selected for the diff. Run
   `scripts/select-checks.mjs` as advice, not as a substitute for judgment.
3. Run `scripts/verify-scope.mjs` against the task's required base and allowed
   prefixes.
4. Run each installed guard applicable to the diff as a second pass.
5. Commit, then read [reviewer-mutation-guard.md](references/reviewer-mutation-guard.md).
   Capture repository state outside the tree, obtain an independent
   behaviorally no-write B review, and verify that the state did not change.
   Treat any mutation as review failure. Never claim enforced per-subagent
   read-only isolation when the parent turn's live permission mode overrides it.
6. On `REVISE`, return findings to the writer, fix within scope, rerun evidence,
   recommit, and request a new review. Repeat until PASS or a real human gate.
7. Push, open a Draft PR, inspect CI, and repair task-caused failures within
   scope. Never merge automatically.

## Stop only at a real gate

Read [human-gates.md](references/human-gates.md). Continue autonomously through
fixable implementation, test, documentation, benchmark, review, and CI issues.
Stop for a genuine human or external boundary and ask for one action only.

## Report

Use [report-contract.md](references/report-contract.md). Report live evidence,
not remembered counts or branch state. Keep runtime discovery honest: static
files do not prove discovery in an already-running Codex session.
