# Delivery Loop

## Sequence

```text
Establish truth
→ Select the next unblocked small task
→ Build the task card
→ Use A when production implementation is required
→ Run native tests, build, lint, and typecheck
→ Verify scope and run applicable guards
→ Commit
→ Capture repository mutation baseline outside the tree
→ Independent behaviorally no-write B review
→ Verify no repository mutation; fail the review on any change
→ If REVISE: return findings to the writer, fix, reverify, recommit, rereview
→ Repeat until PASS or a real human gate
→ Push
→ Open Draft PR
→ Inspect GitHub CI
→ Fix task-caused CI failures, reverify, and rereview
→ Stop at the human gate with one requested action
```

The parent supervisor passes evidence and findings between A and B. The user
must not act as a report courier. Before accepting B's verdict, follow
[reviewer-mutation-guard.md](reviewer-mutation-guard.md). Codex subagents inherit
the parent turn's live permission mode, so B's no-write developer instructions
and the deterministic guard remain mandatory even when its read-only default is
overridden at spawn.

## Verification selection

Run:

```text
node .agents/skills/studio5-delivery/scripts/select-checks.mjs --base <base>
```

The output recommends Core, P0, P3, Worker, Docs, Tooling, or Full regression
and explains why. It never executes tests. Apply task-specific checks in
addition to its safe recommendation.

Run scope verification before delivery:

```text
node .agents/skills/studio5-delivery/scripts/verify-scope.mjs --base <base> --allow <prefix> [--allow <prefix> ...]
```

The scope tool reads changes only and fails for paths outside the allowlist.
It checks rename sources and destinations, deletions, tracked changes, and
untracked files so pre-commit additions cannot escape review.

## Guards

Choose by diff:

- Production code: `$clean-code-guard`.
- Tests: `$test-guard`.
- Documentation: `$docs-guard`.
- Mixed diff: every applicable guard.

Guards are a second pass. They do not replace native tests, the task card, the
scope tool, the B mutation guard, or independent B review.

## Delivery boundary

End with `Commit + Push + Draft PR + Tests + STOP`. Do not merge, enable
auto-merge, delete a branch, or retire a deployment unless a separate explicit
task authorizes it.
