# OPS-AUTOPILOT-002 — Enforced Isolated Read-Only Review

## Classification

- Role: `C — Prototype & Architecture`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `BACKLOG — NOT STARTED`
- Dependency: `OPS-AUTOPILOT-001` delivered and merged by human approval

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

## Candidate delivery boundary

Use one independently reviewed option:

- a separate Codex invocation started in read-only mode; or
- CI/Codex Action review execution with an explicitly read-only sandbox.

Do not select or implement either option within `OPS-AUTOPILOT-001`.

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
