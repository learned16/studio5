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

## Proven-pattern calibration

`R1 — balanced` is eligible, but never forced, for a bounded, low-ambiguity,
repeated proven pattern. This is a downward-routing signal when the work has no
schema or migration, storage semantics, backup, data-meaning, write or mutator,
security, deployment, cutover, concurrency, recovery, novel-algorithm, or
significant-architecture concern. Mechanicality is also a downward signal;
repetitive implementation is not, by itself, a reason to request `R2`.

Medium or large context volume alone does not require `R2`. A `PRODUCTION`
label or a read-only projection of an existing Core contract alone also does
not require `R2`; assess the actual behavior and safety-relevant dimensions.

Use `R2` only when concrete deep-implementation reasons remain, such as
complex production behavior, difficult correctness, a material interaction
between safety-relevant concerns, or genuinely broad context that must be
reasoned about together. Use `R3` for high-risk regression, security-sensitive,
or risky-logic assurance review. The B role does not itself require `R3`:
routine low-risk B review may use the lowest sufficient lower tier.

A new schema or migration, storage or persistence semantics, backup or recovery
behavior, a new write path, or difficult concurrency is an actual deep-work
reason for `R2` or a stronger route as risk requires. Significant new
architecture judgment is a reason to consider `R4` and C; reuse of an approved
architecture is not architecture escalation.

## Capability tiers

| Tier | Suitable work | Reasoning intent |
| --- | --- | --- |
| `R0 — economy` | mechanical, low-risk scans, extraction, repetitive checks, and simple documentation | light/low; start with the least-cost sufficient setup |
| `R1 — balanced` | ordinary low-risk implementation, review, and task preparation | standard/medium |
| `R2 — deep implementation` | complex production behavior, broad context, or difficult correctness work | high |
| `R3 — assurance review` | review of regressions, edge cases, security, or risky logic | high to extra-high; the B role alone does not automatically require R3 |
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
