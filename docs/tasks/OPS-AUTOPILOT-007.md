# OPS-AUTOPILOT-007 — Proven-Pattern Routing Calibration

## Task card

- Task ID: `OPS-AUTOPILOT-007`
- Requirement: `S5-QA-AUTOPILOT-007`
- Type: `TOOLING / GOVERNANCE / EXCLUSIVE`
- Status: `IN PROGRESS`
- Base: `origin/develop@0912af0a33fb02e8cae9edae3c352fde3a5ab4a4`
- Branch: `chore/ops-autopilot-007-proven-pattern-routing`
- Dependencies: PR #22 is merged; OPS-AUTOPILOT-002, -003, and -004 remain
  historical evidence only (`-002` remains owner-deferred).
- Blockers: none

## Goal

Calibrate the existing adaptive-routing policy so a bounded low-ambiguity,
repeated proven read-only pattern is eligible for `R1 — balanced` when its
concrete risk dimensions permit it. This is an eligibility refinement, not a
forced route, new routing system, permanent model pin, product change, or
change to quality gates.

## Evidence and decision boundary

The three consecutive historical P4.5 task cards 002, 003, and 004 each
requested `R2 — deep implementation` with high reasoning. Cards 003 and 004
also record low ambiguity and reuse of the proven surface-local read-facade
pattern. Merged live evidence confirms their surrounding routing policy and
delivery controls integrated: PR #18 merged as
`110d74472dfae2e875e16fa911711607673a9088` and PR #22 merged as
`0912af0a33fb02e8cae9edae3c352fde3a5ab4a4`, each with five successful reported
checks. This task records no claim about effective runtime models because those
values are `NOT EXPOSED`.

This is the one-time material recurring-bottleneck exception to the
OPS-AUTOPILOT-006 optimization freeze. Once it is integrated, the freeze stays
active and the next routing returns to the eligible Phase 4.5 product task.

## Allowed files

- `.agents/skills/studio5-delivery/references/adaptive-model-routing.md`
- `.agents/skills/studio5-delivery/references/task-routing.md`
- `.agents/skills/studio5-delivery/tests/adaptive-model-routing.test.mjs`
- `docs/tasks/OPS-AUTOPILOT-007.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## Forbidden scope

Production modules, selector behavior, authority freeze criteria, `.github`,
CI, P0/P3/Core/Worker, schema, storage, backup, Ink, PDF, Notes, Phase 4.5
product implementation, Phase 5/6, deployment, contracts, and data meaning.

## Acceptance criteria

- `R1` is eligible but not forced for the defined proven pattern.
- Context volume alone, a production label alone, and reading existing Core
  alone do not require `R2`; mechanicality is a downward signal.
- `R2` retains concrete deep-implementation reasons; routine low-risk B review
  is not `R3` merely by role, and high-risk assurance remains `R3`.
- Seven focused regression cases cover those statements.
- PR #22 and task -004 are reconciled as merged/historical; OPS-007 is the only
  active governance task.
- The policy has no permanent concrete model identifier and does not claim an
  unexposed effective runtime value.

## Required checks

- `node .agents/skills/studio5-delivery/scripts/select-checks.mjs --base origin/develop`
- `node --test .agents/skills/studio5-delivery/tests/adaptive-model-routing.test.mjs`
- Markdown and local-link checks for the changed docs
- `node .agents/skills/studio5-delivery/scripts/verify-scope.mjs --base origin/develop` with the allowed paths
- Documentation and test guards, secret scan of changed files, and `git diff --check`

## Routing evidence — A

```yaml
role: A
work_summary: bounded proven-pattern routing calibration
classification:
  complexity: normal
  ambiguity: low
  production_risk: none
  code_context_volume: medium
  architecture_judgment: none
  review_security_sensitivity: medium
  mechanicality: mixed
route_profile: R1
model_capability_tier: balanced
reasoning_tier: standard
selection_mode: explicit
selected_model_identifier: gpt-5.6-terra
selected_reasoning_value: medium
effective_runtime_value: NOT EXPOSED
fork_context: explicit limited-context
fallback: none
owner_override: none
quality_gates_unchanged: true
```

## Device boundary, rollback, and stopping point

No product or device behavior changes are made or claimed. Revert this task's
governance-only commit to restore the prior policy; no migration or recovery is
needed. Stop after the verified commit: the supervisor owns B review and all
remote delivery.
