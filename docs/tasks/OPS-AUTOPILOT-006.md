# OPS-AUTOPILOT-006 — Delivery Credit-Efficiency Guardrails

## Task card

| Field | Value |
| --- | --- |
| Task ID | `OPS-AUTOPILOT-006` |
| Goal | Keep the subscription-only delivery loop safe while making local check selection precise, operational, and proportionate. |
| Requirement IDs | `S5-QA-AUTOPILOT-006`, `S5-UX-P45-SHELL-001`, `S5-QA-P4-001` |
| Task type | `EXCLUSIVE` tooling/governance; no product behavior |
| Dependencies | PR #17 merged as `2c5d0c6`; PR #18 merged as `110d744`; current authority and Phase 4 owner evidence reconciled. |
| Blockers | None. The owner merge gate remains required for this task's future PR. |
| Base | `origin/develop` at task start |
| Branch | `chore/ops-autopilot-006-credit-efficiency` |

## Authorized scope

Allowed paths are limited to:

- `.agents/skills/studio5-delivery/scripts/select-checks.mjs`
- `.agents/skills/studio5-delivery/tests/select-checks.test.mjs`
- `.agents/skills/studio5-delivery/references/adaptive-model-routing.md`
- `.agents/skills/studio5-delivery/references/delivery-loop.md`
- `.agents/skills/studio5-delivery/references/task-routing.md`
- `.agents/skills/studio5-delivery/references/report-contract.md`
- `.agents/skills/studio5-delivery/assets/master-autopilot-prompt.md`
- `docs/tasks/OPS-AUTOPILOT-006.md`
- `docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `docs/ACCEPTANCE_TESTS.md`

Forbidden: `.github/**`, package manifests and lockfiles, production modules,
Core/P0/P3/Worker behavior, schema, storage, backup, Ink, API keys, Phase 4.5
product work, Phase 5, auto-merge, and merge operations.

## Acceptance and deterministic proxy evidence

1. Routine `PROJECT_STATUS.md`, `docs/TRACEABILITY.md`, and ordinary
   `docs/tasks/**` evidence updates recommend `Docs`, not `Full regression`.
2. Authority, AGENTS, root manifests/locks, workflow configuration,
   schema/migrations, shared Core/runtime, storage/backup/browser-persistence,
   and real Worker, Service Worker, build-closure, or deployment paths remain
   conservative and recommend `Full regression`. Ordinary P3 application paths
   remain the narrower P3 + Worker mapping unless independently critical.
3. `prototype/p45-product-shell-web/**` recommends `P4.5` with the existing,
   runnable local `lint`, `typecheck`, `test`, and `build` commands. A P4.5
   change plus status/trace evidence adds `Docs`; an actual P3/Worker path adds
   P3 and Worker; a Core/schema high-risk path adds `Full regression`.
4. Selector reasons and commands are deterministic. The tests are proxy
   evidence for check-selection precision only: no currency, token, time, or
   savings claim is made.
5. The current `.github/workflows/ci.yml` is recorded accurately: it runs
   Core, P0, P3, and Worker checks, but not an independent P4.5 job. This is a
   material CI-coverage finding, not authorization to redesign CI.
6. The automation optimization freeze and future routing are documented: after
   this task integrates, a bare `continue` returns to the next eligible Phase
   4.5 product-critical-path task; it does not select another optimization task
   without a correctness, safety, broken-workflow, material recurring-bottleneck,
   or owner-request trigger.

## Required checks

- all Studio5-delivery tooling tests;
- focused `select-checks` scenarios;
- P4.5 local `lint`, `typecheck`, `test`, and `build`;
- Markdown and local-link checks;
- scope verification against `origin/develop` using the paths above;
- applicable docs and test guards, secret scan, and `git diff --check`.

The ordinary narrow P4.5 plus routine status/traceability case does not select
Full regression. This specific OPS-AUTOPILOT-006 diff also changes an authority
file, which is a conservative Full-regression trigger; Full Core/P0/P3/Worker
regression was therefore selected and run. Existing remote CI remains unchanged.

## Delivery boundaries

No device claim is created. Existing Phase 4 owner evidence is only reconciled
where the authority expressly supports it; the published Worker-specific
Ink/pen/Palm gate remains unclaimed. If rollback is needed, safely revert the
task/PR changes with the appropriate revert commit or commits; do not rewrite
history merely to make rollback appear single-commit. Stop after independent B
review, mutation guard, push, Draft PR, and current CI; the owner alone decides
merge.

## A routing evidence

```yaml
role: A
work_summary: bounded tooling/governance delivery-credit-efficiency guardrails
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
