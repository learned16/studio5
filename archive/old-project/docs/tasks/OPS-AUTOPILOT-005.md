# OPS-AUTOPILOT-005 — Adaptive Model and Reasoning Routing

## Task card

- Task ID: `OPS-AUTOPILOT-005`
- Requirement: owner-approved Control Plane operating policy
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `DRAFT PR #18 — FINAL PR-HEAD CI RECHECK PENDING`
- Base: `origin/develop@261c1e3`
- Branch: `chore/adaptive-model-reasoning-routing`
- Dependencies: merged automation foundation through PR #16
- Blockers: none

## Goal

Make routine Studio5 delivery choose an appropriate available model capability
and reasoning effort automatically before each A, B, or C invocation. The
policy is adaptive and capability-based, preserves all quality and human gates,
and does not require routine owner model-selection input.

## Allowed files

- `docs/tasks/OPS-AUTOPILOT-005.md`
- `docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md`
- `AGENTS.md`
- `.agents/skills/studio5-delivery/SKILL.md`
- `.agents/skills/studio5-delivery/references/adaptive-model-routing.md`
- `.agents/skills/studio5-delivery/references/task-routing.md`
- `.agents/skills/studio5-delivery/references/delivery-loop.md`
- `.agents/skills/studio5-delivery/references/report-contract.md`
- `.agents/skills/studio5-delivery/assets/master-autopilot-prompt.md`
- `.agents/skills/studio5-delivery/tests/adaptive-model-routing.test.mjs`
- `.agents/skills/studio5-delivery/tests/foundation-contract.test.mjs`
- `.agents/skills/studio5-delivery/tests/continue-control-plane.test.mjs`

`PROJECT_STATUS.md` and `docs/TRACEABILITY.md` are intentionally excluded
because the still-open PR #17 owns those shared files. The parent supervisor
must reconcile their delivery status after that PR's human merge gate; this
task does not alter them.

## Forbidden scope

- Production behavior, Core, P0, P3, Worker, schema, storage, backup, or data meaning.
- `.codex/**` configuration and A/B/C agent TOML files.
- GitHub workflows, package manifests, lockfiles, API keys, paid API automation,
  Full Access, unsafe bypass, automatic merge, any merge, Phase 4.5, and Phase 5.

## Policy acceptance criteria

- Classify complexity, ambiguity, production risk, code/context volume,
  architectural judgment, review/security sensitivity, and repetitive/mechanical
  character before every A/B/C spawn.
- Route R0 economy/light, R1 balanced/medium, R2 deep/high, R3 B assurance, and
  R4 C architecture by capability; select the lowest sufficient available setup.
- Highest safety-relevant dimension wins; volume alone cannot force maximum.
- Runtime unavailability uses and records a safe fallback instead of failing.
- The owner can make a per-task override; reusable policy and prompt contain no
  permanent model slug or global/agent pin.
- Explicit selections use limited context and record requested versus effective
  values truthfully; inherited full-history values are recorded as inherited.
- Tests, B review, scope guards, and human gates are invariant.
- Evidence records each role, classification, tier, requested/effective model and
  reasoning, fork context, and fallback/override; unavailable runtime values use
  `NOT EXPOSED`.

## Implementation evidence — 9 August 2026

The C architecture assessment was needed because this policy controls all
future A/B/C routing. Its classification was: complexity `complex`, ambiguity
`medium`, production risk `low`, code/context volume `large`, architectural
judgment `significant`, review/security sensitivity `medium`, and mechanicality
`judgment-heavy`. It selected `R4 — architecture` with selection mode
`explicit` and finite fork context, while keeping every quality gate unchanged.
Requested transient model identifier:
`gpt-5.6-sol`; requested reasoning: `xhigh`; effective model and reasoning:
`NOT EXPOSED`. This is delivery evidence only, not a reusable policy pin.

The A implementation is normal scoped governance work. It classified medium
complexity, low ambiguity, no product risk, medium code/context volume,
moderate architectural judgment after C, high review/security sensitivity, and
mixed mechanicality. It selected `R1 — balanced` with selection mode `explicit`
and finite fork context, while keeping every quality gate unchanged.
Requested transient model identifier: `gpt-5.6-terra`; requested reasoning:
`medium`; effective model and reasoning: `NOT EXPOSED`. This is delivery
evidence only, not a reusable policy pin.

## B review repair evidence — 9 August 2026

The first independent B review returned `REVISE` for two governance-contract
issues: the master prompt still prohibited authority-approved incremental Phase
4.5 work, and the adaptive routing test accepted a requirement if it existed on
only a different surface. This repair removes the stale Phase 4.5 prohibition,
keeps the rule that `continue` grants no product scope or unauthorized stage,
and keeps Phase 5 blocked. It also makes every critical surface prove its own
required routing hook/evidence and protects the reusable master prompt from
transient PR, SHA, count, branch, and stale phase-routing state.

Repair invocation routing: complexity `simple`, ambiguity `low`, production
risk `none`, code/context volume `small`, architectural judgment `none`,
review/security sensitivity `high`, and mechanicality `mixed`. It selects
`R1 — balanced`, reuses an explicit limited-context A invocation, and keeps all
quality gates unchanged. Requested transient model identifier:
`gpt-5.6-terra`; requested reasoning: `medium`; effective model and reasoning:
`NOT EXPOSED`; fallback/owner override: none. This is delivery evidence only,
not a reusable policy pin.

Status-correction invocation routing: complexity `trivial`, ambiguity `low`,
production risk `none`, code/context volume `small`, architectural judgment
`none`, review/security sensitivity `medium`, and mechanicality `repetitive`.
It selects `R0 — economy` with light reasoning through an explicit finite,
no-history invocation, while keeping all quality gates unchanged. Requested
transient model identifier: `gpt-5.6-terra`; requested reasoning: `low`;
effective model and reasoning: `NOT EXPOSED`; fallback/owner override: none.
This is delivery evidence only, not a reusable policy pin.

## Final review and Draft PR evidence — 9 August 2026

Draft PR #18 is `OPEN` against `develop` at published head
`3599121ac539cd5b6ef6b6fd2dd15745fc40f98f`; `autoMergeRequest` is `null`.
Its five named checks succeeded: `Studio5 Core`, `P0 Ink Web`,
`P3 Lecture Capture Web`, `Cloudflare Worker Static Assets`, and
`Workers Builds: studio5`. Those initial CI results apply to `3599121`; this
unpublished evidence-only commit requires a final CI recheck after push.

Independent B1 review routing: complexity `complex`, ambiguity `low`,
production risk `none`, governance sensitivity `high`, code/context volume
`large`, architectural judgment `moderate`, review/security sensitivity `high`,
and mechanicality `judgment-heavy`. It selected `R3 — assurance` through an
explicit finite-context invocation. Requested transient model identifier:
`gpt-5.6-sol`; requested reasoning: `xhigh`; effective model and reasoning:
`NOT EXPOSED`; outcome: `REVISE`; mutation guard: `PASS`; fallback/owner
override: none; quality gates unchanged.

Independent B2 review routing: complexity `normal`, ambiguity `low`,
production risk `none`, code/context volume `medium`, architectural judgment
`low`, review/security sensitivity `high`, and mechanicality `judgment-heavy`.
It selected `R3 — assurance` through an explicit finite-context invocation.
Requested transient model identifier: `gpt-5.6-sol`; requested reasoning:
`high`; effective model and reasoning: `NOT EXPOSED`; outcome: `REVISE` for a
status finding; mutation guard: `PASS`; fallback/owner override: none; quality
gates unchanged.

Independent B3 review routing: complexity `simple`, ambiguity `low`,
production risk `none`, code/context volume `small`, architectural judgment
`none`, review/security sensitivity `medium`, and mechanicality `repetitive`.
It selected `R1 — balanced` through an explicit finite-context invocation.
Requested transient model identifier: `gpt-5.6-terra`; requested reasoning:
`medium`; effective model and reasoning: `NOT EXPOSED`; outcome: `PASS`;
mutation guard: `PASS`; fallback/owner override: none; quality gates unchanged.

Final-evidence update invocation routing: complexity `trivial`, ambiguity
`low`, production risk `none`, code/context volume `small`, architectural
judgment `none`, review/security sensitivity `medium`, and mechanicality
`repetitive`. It selects `R0 — economy` with light reasoning through a reused
explicit no-history finite A invocation, while keeping all quality gates
unchanged. Requested transient model identifier: `gpt-5.6-terra`; requested
reasoning: `low`; effective model and reasoning: `NOT EXPOSED`;
fallback/owner override: none. This is delivery evidence only, not a reusable
policy pin.

## Required checks

- `node --test .agents/skills/studio5-delivery/tests/*.test.mjs`
- `node .agents/skills/studio5-delivery/scripts/select-checks.mjs --base origin/develop`
- exact scope verification with every allowed path above
- Markdown/local-link checks exercised by tooling contracts
- documentation and test guard review
- changed-file secret scan
- `git diff --check`

No product behavior changes occur, so product native regression is not selected
by this task's code-free scope. The parent supervisor owns B review, mutation
guard, push, Draft PR, CI, and the human merge gate after this commit.

## Rollback

Revert this task's isolated governance commits. No data, deployment, product,
or device recovery is needed.
