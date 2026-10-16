# Subscription-Only Supervised Delivery

Use this path while the owner has deferred API-funded automation. It uses one
Studio5 Codex Project, one supervisor, the existing Codex subscription, native
repository checks, installed guards, and current GitHub CI.

## Required sequence

```text
Establish live repository truth
→ select the smallest unblocked authorized task
→ assign one scoped writer (A for implementation)
→ run native checks, scope verification, and applicable guards
→ A commits and stops
→ capture the mutation baseline outside the repository
→ independent behaviorally no-write B review
→ verify the mutation guard and reject any mutated review
→ if REVISE: repair, recheck, recommit, and repeat B review
→ supervisor pushes
→ supervisor opens a Draft PR
→ inspect current GitHub CI and repair task-caused failures through the review loop
→ stop before the owner merge gate
```

Push and Draft PR creation are delivery actions owned by the supervisor. They
must not occur before both B review and mutation verification pass. No agent
may merge or enable automatic merge.

## Roles

- The supervisor reconciles authority, status, task, Git, Pull Request, and CI
  evidence; selects routine technical work; transfers findings between agents;
  and owns remote delivery.
- `A — Production` makes the smallest authorized change, runs its checks,
  commits, reports evidence, and stops without push or Pull Request creation.
- `B — Review & QA` independently reads the authority, task, diff, and evidence.
  It reports `PASS` or `REVISE` with severity-ordered findings and never mutates
  the repository or performs delivery actions.
- `C — Prototype & Architecture` runs only for a genuine architecture,
  prototype, dependency, or research need. It is not a routine loop step.

## B isolation truth

When B is spawned beneath a writable parent, its no-write rule is behavioral;
it is not an enforced per-agent read-only sandbox. The supervisor must capture
and verify the deterministic repository mutation guard around every B review.
Any mutation invalidates the verdict and blocks delivery.

## Spending and phase boundary

This path does not request an API key, invoke paid API automation, run a Codex
GitHub Action, use Full access or an unsafe bypass, or enable automatic merge.
It does not authorize Phase 4.5 or Phase 5. Merge always requires the owner.

The independently invoked, enforced read-only reviewer remains separate
deferred work. Its future plan must not become a hidden acceptance gate for the
subscription-only loop.
