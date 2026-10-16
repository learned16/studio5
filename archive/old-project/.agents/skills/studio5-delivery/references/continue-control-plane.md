# Subscription-Only Continue Control Plane

A bare owner `continue` authorizes exactly one governed delivery loop. It does
not authorize a product phase, feature, architecture change, or merge.

## Reconcile before routing

1. Establish live repository truth from authority, status, task files, the
   working tree, current remotes, GitHub Pull Requests, reported checks, and
   current test evidence. Do not use conversation memory as repository state.
2. Reconcile the previous delivery before selecting new work. Classify its
   observable Pull Request, review, mutation-guard, and CI state:
   - **Merged and integrated:** apply the merge-method-aware rule in
     [authority-and-freshness.md](authority-and-freshness.md). GitHub PR state,
     merge-commit reachability, and current tree evidence prove integration;
     original-head ancestry is optional. Start from current `origin/develop`
     and select exactly one new task.
   - **Open and merge-ready:** when CI is fully green, B and the mutation guard
     passed, and no unresolved blocking finding remains, stop at the existing
     human merge approval. Do not start a new task.
   - **Open and repairable:** when a task-caused CI failure, B `REVISE`, or an
     unresolved fixable finding exists, resume the same task's
     repair/check/commit/B/guard/push/CI loop. Do not ask the owner to merge and
     do not start a new task.
   - **Closed without merge or genuinely unreconciled:** investigate and report
     the exact blocker. Continue any safe in-scope reconciliation; stop only if
     a real human or external gate remains. Do not start a new task.
3. Never continue on the previous task branch after integration or another
   stale branch. No open prior delivery permits a second task.

## Select one task

Select exactly one highest eligible uncompleted and unblocked task from current
authority, status, task cards, dependency evidence, and repository truth.
Resolve blockers before dependents. A single `continue` never starts multiple
tasks or silently widens the selected task card.

Make routine technical choices from established contracts and evidence. Do not
ask the owner to choose filenames, test organization, implementation details,
or other ordinary engineering decisions. Stop only when
[human-gates.md](human-gates.md) identifies a real human or external boundary.

## Execute the subscription-only loop

Use this order:

```text
Supervisor establishes live truth and selects one task
→ A implements only the allowed scope
→ native checks, scope verification, and applicable guards pass
→ A commits and stops before remote delivery
→ supervisor captures the repository mutation baseline outside the tree
→ independent behaviorally no-write B review
→ supervisor verifies the mutation guard
→ on REVISE, A repairs, rechecks, recommits, and stops for another B review
→ supervisor pushes
→ supervisor opens a Draft PR
→ current GitHub CI passes or task-caused failures re-enter the repair/review loop
→ stop before the owner merge gate
```

Push and Draft PR creation must not occur before both B review and mutation
verification pass. B is behaviorally no-write when spawned beneath a writable
parent; it is not an enforced per-agent read-only sandbox in that runtime. Any
repository mutation invalidates B's verdict.

C is not a default loop step. Use C only for a genuine architecture, prototype,
dependency, or research need that cannot be resolved from current authority and
repository evidence.

## Hard boundaries

The subscription-only control plane:

- does not request or require an `OPENAI_API_KEY`;
- does not invoke the OpenAI API or Codex GitHub Action;
- does not use Full access or an unsafe bypass;
- does not enable automatic merge or perform a merge;
- does not start Phase 4.5 or Phase 5 merely because the owner said `continue`.

Production scope must come from explicit authority and an eligible task card,
never from the `continue` command itself. Merge remains an owner decision.
