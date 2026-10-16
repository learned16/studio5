# OPS-AUTOPILOT-002 — Enforced Isolated Read-Only Review

## Classification

- Role: `C — Prototype & Architecture`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `DEFERRED BY OWNER — API AUTOMATION LATER`
- Dependency: `OPS-AUTOPILOT-001` delivered and merged by human approval

## Owner decision — 9 August 2026

The owner has deferred API-funded automation:

- no `OPENAI_API_KEY` will be added now;
- the OpenAI API and paid Codex GitHub Action automation will not be used at
  this stage;
- Studio5 will continue with the existing Codex subscription only;
- enforced GitHub/API-based read-only B review is deferred until the owner
  decides to fund automation infrastructure;
- the absence of `OPENAI_API_KEY` is intentional and is not a defect to fix.

This decision changes the implementation timing only. It does not cancel the
goal, acceptance criteria, safety contract, or future implementation plan in
this brief.

## Goal

Run the independent Studio5 B reviewer from an invocation whose parent starts
with an enforced read-only sandbox, rather than spawning B beneath a writable
parent turn whose live permission override is inherited.

## Authority and runtime boundary

Current [official OpenAI Subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents)
states that local subagents inherit the parent turn's current sandbox policy
and permission mode, and that live runtime overrides are reapplied at spawn.
Therefore this task must establish isolation at the parent invocation boundary.
It must not use Full access or claim that a child-only TOML default overrides a
writable live parent mode.

## Preserved future delivery boundary

Use one independently reviewed option:

- a separate Codex invocation started in read-only mode; or
- CI/Codex Action review execution with an explicitly read-only sandbox.

Do not select or implement either option within `OPS-AUTOPILOT-001`.

The preferred future option remains an independent Linux GitHub Actions job
using `openai/codex-action@v1` with `sandbox: read-only`. The design follows the
[official Codex GitHub Action documentation](https://learn.chatgpt.com/docs/github-action)
and [official sandbox documentation](https://learn.chatgpt.com/docs/sandboxing).

When the owner reactivates this task, the implementation must preserve these
boundaries:

- the Codex review job has only `contents: read`;
- checkout uses `persist-credentials: false`;
- the API secret is exposed only to the Codex action step that needs it;
- Codex analysis and any later PR-comment publishing use separate jobs, so the
  Codex invocation itself never receives repository write permission;
- `danger-full-access`, unsafe bypasses, automatic merge, commits, pushes, and
  PR creation remain forbidden to the reviewer;
- a controlled repository mutation is attempted and must be blocked by the
  sandbox before the task can pass.

## Acceptance criteria

- B runs independently with a parent invocation that is enforced read-only.
- A controlled mutation attempt is blocked by the sandbox and leaves the
  repository unchanged.
- B's developer instructions still forbid edits, commits, pushes, PR creation,
  and merges.
- The deterministic `review-mutation-guard.mjs` check also passes as
  defense-in-depth.
- No Full access, production behavior change, schema change, or automatic merge
  is introduced.
- Native tooling tests, applicable guards, and CI all pass before delivery.

These criteria remain the future completion gate. The task is not `DONE` and
no enforced-isolation PASS is claimed while it is deferred.

## Preserved regression-test plan

Future contract tests must fail if any of the following occurs:

- the independent reviewer sandbox is not `read-only`;
- the Codex review execution receives `contents: write` or retained checkout
  write credentials;
- Full access, an unsafe bypass, or automatic merge is enabled;
- the controlled mutation attempt or `review-mutation-guard.mjs` is removed;
- B is run beneath a writable parent while the configuration claims enforced
  isolation;
- the review contract permits file changes, commit, push, PR creation, or
  merge.

The tests must verify required properties without forbidding unrelated,
legitimate future configuration additions.

No OPS-AUTOPILOT-002 workflow or test implementation was committed before this
deferral; this section preserves the researched contract so work can resume
without repeating the design investigation.

## Current subscription-only operating path

Until the owner reactivates API automation, Studio5 uses:

1. one Studio5 Codex Project and one supervisor;
2. `A — Production` for scoped implementation and native checks;
3. independent behaviorally no-write `B — Review & QA`, protected by the
   existing deterministic before/after mutation guard;
4. `C — Prototype & Architecture` only when the task needs it;
5. native tests, applicable guards, scope verification, and current GitHub CI;
6. supervisor-controlled push and Draft PR delivery;
7. a hard stop before merge.

This path uses no API key, no Full access, no automatic merge, and does not
start Phase 4.5 or Phase 5.

The next automation backlog item is `OPS-AUTOPILOT-003 — Subscription-Only
Supervised Delivery Validation`: validate this existing path end to end on a
governance/tooling-only task, without production changes or paid API
automation.

## Allowed scope

Task brief, reviewed automation/invocation configuration, B reviewer
configuration, Studio5 delivery skill documentation/tests, and governance
status/traceability files required for this capability.

## Forbidden scope

Production modules, Core, P0/P3 behavior, Worker production configuration,
schema/storage/backup, Phase 5, credentials, Full access, and automatic merge.

## Rollback

Revert the task's isolated-review configuration and documentation commits. No
user data or production behavior requires migration or recovery.

While deferred, there is no runtime configuration to roll back. Reactivation
requires a new explicit owner decision to begin API automation spending.
