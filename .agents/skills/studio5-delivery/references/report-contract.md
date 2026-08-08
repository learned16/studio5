# Report Contract

Lead with the outcome and include only current, verified evidence:

1. Task and classification.
2. Base and branch actually used.
3. Authority and implementation-state reconciliation result.
4. Commit and Draft PR URL when delivery reached that point.
5. Modified files and scope-verification result.
6. Native check names and exact current results.
7. Applicable guard results.
8. Independent reviewer verdict, the before/after mutation-guard result, and
   resolved or remaining findings.
9. Device evidence explicitly claimed and explicitly not claimed.
10. Remaining risk, deferred isolated-review enforcement, or real human gate.
11. Confirmation of no automatic merge.

Do not report remembered test counts, stale PR state, or inferred device PASS.
Record runtime discovery as separate claims:

- `Skill discovery: PASS|FAIL`
- `A/B/C discovery: PASS|FAIL`
- `Config/concurrency discovery: PASS|FAIL`
- `B behavioral no-write review: PASS|FAIL`
- `Enforced per-subagent read-only under writable parent: CURRENT RUNTIME LIMIT / DEFERRED`

Overall `RUNTIME DISCOVERY: PASS` requires the first four claims to pass. The
fifth claim is a disclosed current-runtime limit, not an impossible gate for a
subagent spawned by a writable parent. Never describe the B sandbox as enforced
in that case. Track independently invoked read-only isolation as separate work.

Finish with one user action only. Do not ask the user to relay reports between
agents.
