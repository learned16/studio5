# Human Gates

Stop only for one of these boundaries:

1. A real-device test the agent cannot perform.
2. A genuinely subjective UX, visual, or product choice.
3. A cost, subscription, or purchase decision.
4. Privacy/security permission or sending data to an external service.
5. An unavailable secret, OAuth grant, account, or external authorization.
6. A sensitive architecture, contract, or schema change requiring change
   control.
7. An irreversible destructive operation or migration.
8. A real unresolved authority conflict.
9. Merge approval.
10. An external blocker the agent cannot resolve safely within scope.

Do not stop for function naming, test organization, a small implementation
choice inside an approved contract, lint or task-caused CI failure, a writable
missing test, documentation drift, a benchmark rerun, or a reviewer finding
that can be fixed within the task card.

When stopping, request exactly one clear action, for example:

- `READY TO MERGE PR <number>`
- `DEVICE TEST REQUIRED — <count> checks`
- `NEEDS DECISION — <one decision>`

Never represent automated evidence as physical-device or subjective approval.
