# Authority, Freshness, and Integration Evidence

## Authority order

1. The latest explicit, dated user decision recorded in
   `docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md`.
2. `docs/authority/Studio5_One_Time_Full_Build_Spec_v5_AR.md` for all remaining
   scope.
3. Tests, pull requests, Git, and the current tree as implementation evidence.
4. Older documents as history only.

A newer decision changes only its conflicting slice. Git history never defines
product scope. The full five-year platform remains authoritative while current
academic-year needs receive implementation priority.

## Freshness protocol

At every invocation:

1. Read repository instructions, current authority, current status, and the
   task brief.
2. Run `git status`, identify HEAD and the intended base, and inspect the local
   diff.
3. Fetch/prune when the requested result depends on remote state.
4. Query GitHub directly for PR state and checks when a PR is involved.
5. Compare implementation claims with current files and tests.
6. Correct status drift in an authorized documentation scope. Never rewrite
   authority because implementation evidence differs.

Do not persist an active PR number, current SHA, test count, active branch,
current batch, temporary worker name, or timestamp in this reusable skill.

## Canonical PR integration rule

Use:

`GitHub PR state + merge commit reachability + current repository evidence`

Require all of the following:

- GitHub reports `state == MERGED`.
- The reported base branch is the expected base.
- `mergedAt` and `mergeCommit.oid` are present.
- All required checks are successful. When branch protection has no required
  checks, record that fact and still inspect every reported check.
- `git merge-base --is-ancestor <mergeCommit.oid> origin/<base>` succeeds.
- `git show --stat --oneline <mergeCommit.oid>` and the current base tree contain
  the expected task evidence.

Original PR-head ancestry is optional corroboration only. Never use it as a
universal pass/fail condition.

### Merge-strategy regression matrix

| Integration style | Merge commit reachable | Original head reachable | Expected result |
|---|---:|---:|---|
| Normal merge | yes | often yes | PASS when GitHub/check/tree evidence also passes |
| Squash merge | yes | not required | PASS; rewritten or omitted original commits are valid |
| Rebase/history rewrite | yes | not required | PASS; original commit SHAs may be replaced |
| Any style, merge commit absent/unreachable | no | any | STOP — base is not reconciled |
| Any style, wrong base or failed required check | any | any | STOP or repair the real blocker |
| Any style, expected repository evidence missing | yes | any | Investigate; do not claim integration |

Run
`node --test .agents/skills/studio5-delivery/tests/verify-pr-integration.test.mjs`
to keep the first three positive scenarios and the unreachable-merge negative
scenario covered.
