# Task Routing

## Classify before execution

Use one or more labels:

- `BLOCKER`: blocks a required gate or the current critical path.
- `DEPENDENT`: cannot start until its declared blocker is complete.
- `PARALLEL-SAFE`: independent branch, worktree, files, decisions, and evidence.
- `RESEARCH-ONLY`: read-only investigation with no implementation.
- `PROTOTYPE-ONLY`: isolated experimental surface with a replacement boundary.
- `PRODUCTION`: changes product behavior or production modules.
- `EXCLUSIVE`: touches shared governance, tooling, schema, or integration files.

Choose the highest uncompleted, unblocked requirement closest to the current
critical path. Resolve blockers before dependents. Do not turn a missing
ordinary implementation choice into a user decision.

## Internal task card

Produce these fields before work:

```text
Task ID
Goal
Requirement IDs
Task type
Dependencies
Blockers
Base
Branch
Allowed files
Forbidden files
Shared files
Required checks
Device boundary
Human gates
Rollback
Stopping point
```

Make the card specific enough that scope can be verified mechanically.

## Agent selection

- Use `studio5_a_production` for authorized production implementation.
- Use `studio5_b_review` after a clear commit for independent read-only review.
- Use `studio5_c_architecture` for architecture, isolated prototypes, research,
  dependency maps, or task preparation.
- Read-heavy independent audits may run in parallel.
- C may run in parallel only when its result cannot change an implementation
  decision already in progress.
- Default to one writer. Never let A and another writer edit the same branch or
  files concurrently.

Treat these as shared/exclusive by default:

```text
AGENTS.md
PROJECT_STATUS.md
docs/TRACEABILITY.md
docs/authority/**
package.json and lockfiles
wrangler.jsonc
.github/**
.codex/**
.agents/**
schema and migrations
shared runtime or style files
```

Concurrency limits are ceilings, not instructions to fill every slot and not
permission for parallel writing.
