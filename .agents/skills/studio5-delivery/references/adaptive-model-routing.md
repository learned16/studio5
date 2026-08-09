# Adaptive Model and Reasoning Routing

The owner has approved adaptive routing for routine Studio5 work. The
supervisor chooses the lowest sufficient currently available setup before each
A, B, or C invocation. This policy is capability-based: it never names a
permanent model or assumes that a particular runtime option will remain
available.

## Classify before every spawn

Record a short assessment of all seven dimensions:

1. complexity: `trivial`, `simple`, `normal`, or `complex`;
2. ambiguity: `low`, `medium`, or `high`;
3. production risk: `none`, `low`, `medium`, `high`, or `critical`;
4. code and context volume: `small`, `medium`, or `large`;
5. need for architectural judgment: `none`, `moderate`, or `significant`;
6. review or security sensitivity: `low`, `medium`, `high`, or `critical`; and
7. mechanicality: `repetitive`, `mixed`, or `judgment-heavy`.

Use the highest safety-relevant dimension, not a simple average. Context volume
alone does not require maximum reasoning. A routine documentation correction,
for example, normally stays economical unless another dimension makes it risky.

## Capability tiers

| Tier | Suitable work | Reasoning intent |
| --- | --- | --- |
| `R0 — economy` | scans, extraction, repetitive checks, simple documentation | light/low |
| `R1 — balanced` | normal scoped implementation and ordinary task preparation | standard/medium |
| `R2 — deep implementation` | complex production behavior, broad context, or difficult correctness work | high |
| `R3 — assurance review` | B review of regressions, edge cases, security, or risky logic | high to extra-high |
| `R4 — architecture` | C research or architecture with material tradeoffs | extra-high to maximum when justified |

Select the least costly available model and reasoning effort that meets the
chosen tier. Prefer a fast/economical option at `R0`, a balanced option at
`R1`, and the strongest suitable option at `R2`–`R4`. Quality gates do not
change with the tier: required tests, B review, scope guards, and human gates
remain mandatory.

## Availability and fallback

Inspect the runtime-advertised choices immediately before an explicit spawn.
The Supervisor may explicitly select a model and reasoning effort when the
classification justifies it. If a preferred model is unavailable, try another
option in the same capability tier, then the next stronger tier, then the
strongest remaining safe alternative. For reasoning effort, try the target,
then the nearest higher available effort, then the highest available lower
effort. Record the fallback and continue; unavailability alone is not a task
failure. Do not encode a concrete model slug in this reusable policy, agent
configuration, or the master prompt.

An owner may override the tier, model capability, or reasoning effort for one
exceptional task. Record the override and its scope; it does not become a global
pin. When an explicit model or reasoning selection is passed to a spawned
agent, use `fork_turns: "none"` or a finite positive value. A full-history fork
inherits the parent model and reasoning and must be recorded as inherited,
never as an effective explicit selection.

## Delivery evidence

For each A, B, or C invocation, record:

```yaml
role: <A | B | C>
work_summary: <bounded task>
classification:
  complexity: <value>
  ambiguity: <value>
  production_risk: <value>
  code_context_volume: <value>
  architecture_judgment: <value>
  review_security_sensitivity: <value>
  mechanicality: <value>
route_profile: <R0 | R1 | R2 | R3 | R4>
model_capability_tier: <economy | balanced | frontier | assurance | architecture>
reasoning_tier: <light | standard | deep | extra-high | maximum>
selection_mode: <explicit | inherited | owner-override>
selected_model_identifier: <runtime-transient identifier | NOT EXPOSED>
selected_reasoning_value: <runtime-transient value | NOT EXPOSED>
effective_runtime_value: <runtime-reported values | INHERITED | NOT EXPOSED>
fork_context: <explicit limited-context | inherited full-history>
fallback: <none | details>
owner_override: <none | details>
quality_gates_unchanged: true
```

Runtime-transient identifiers are delivery evidence, not canonical policy. Do
not guess an effective value when the runtime does not expose it; write
`NOT EXPOSED`. This evidence makes routing auditable without pinning future
Codex availability.
