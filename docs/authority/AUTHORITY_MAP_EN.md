# Studio5 Authority Map

Status: Governance baseline for review. This document maps authority; it does not change product code, approve a Design Freeze, or silently decide an open conflict.

## Authoritative source

The highest current project authority is the byte-for-byte repository copy of [Studio5 One-Time Full Build Specification v5.0 (Arabic)](./Studio5_One_Time_Full_Build_Spec_v5_AR.md), dated 22 July 2026.

- SHA-256: `59e93b0430bc9efc0e801732d575bfc29ef72d7cc474cee9081c33c9d7619ebe`
- Repository copies of versions 2, 3, and 4 are superseded as governing specifications. They may be consulted only as historical evidence.
- This map is subordinate to v5 and to a later explicit user decision that is recorded through the rule below.

## Order of authority

When two statements conflict, apply this order and record the conflict rather than blending the statements:

1. Explicit decisions and corrections in v5.
2. A later explicit user decision recorded in the Change Ledger with its date, source, scope, and status.
3. Detailed requirements in v5 that are not displaced by item 1 or 2.
4. Independent review recommendations only where they do not conflict with items 1–3.
5. Repository governance and product documents as implementation evidence and context, not as authority over items 1–4.
6. Older specifications, drafts, handoffs, labels, and historical conversations as interpretive history only.

An implementation, test, prototype, ADR, issue, pull request, or status label is evidence of repository state. It does not by itself amend the contractual scope.

## Rule for later user decisions

A later user decision may refine, replace, or narrow an earlier statement only when all of the following are recorded:

- decision date and a durable source reference;
- exact decision and affected v5 sections or existing ledger entries;
- scope: contractual, product, architecture, delivery, experiment, or temporary gate;
- status: proposed, adopted, superseded, historical, or revoked;
- impact on requirements, acceptance, data, compatibility, schedule, and ownership;
- whether the decision is permanent or has an expiry/review gate.

If the later instruction is ambiguous, operational only, or missing a durable record, preserve both statements in the [Conflict Register](./CONFLICT_REGISTER_EN.md) and request confirmation. Do not infer that progress in the repository silently cancels v5. The initial post-v5 decisions awaiting canonical transcription are listed in [Change Ledger Seed](./CHANGE_LEDGER_SEED_EN.md).

## Durable decisions carried by v5

These are durable unless a later explicit user decision changes them:

- Studio5 is one user-owned platform with a permanent five-year Core, not a disposable Year 1 application.
- Final contractual scope is the complete five-year platform described by v5, subject to the unresolved execution conflict recorded as `CR-001`.
- Annual activation controls visibility and relevance; it must not destroy historical data or fork the Core.
- Subject Profiles and Capability Packs configure academic differences. Year-specific subject names and assumptions must not be hard-coded into Core.
- The product keeps its five primary interfaces and eight functional engines as separable responsibilities.
- Data is local-first/offline-first. Stable IDs, versioning, migrations, recoverability, provenance, immutable originals, and full export are first-class requirements.
- Vector/source data remains authoritative for ink and artifacts. Rendered bitmaps and previews are derivatives, not replacements for editable source data.
- Risky technology is proven through prototypes and measurable gates before broad reliance.
- Engineering proceeds through small, reviewable changes with automated verification, rollback awareness, and honest capability detection.
- Adapters for PDF, cloud, AI, desktop, CAD/BIM, and other external systems must remain replaceable and must expose truthful fallbacks.
- The user owns source code, repositories, accounts, data, documentation, installers, and recovery/export capability and must not depend on annual developer intervention.
- A contract, interface, placeholder, document, feature flag, or prototype alone does not satisfy final completion. Working implementation and final acceptance evidence are required.
- No requirement is removed, deferred, redefined, or marked complete silently.

## Decisions not yet settled

V5 explicitly leaves these technical decisions open pending evidence and approval:

- final cross-platform technology and UI/Core stack;
- local database and the final synchronization/conflict protocol;
- cloud storage, backup, hosting, and deployment details;
- final PDF engine;
- search, indexing, and handwriting-recognition approach;
- authentication, encryption, secrets, privacy, and telemetry details;
- cloud and AI providers, models, cost controls, and degraded modes;
- Desktop Companion architecture, wake/relay boundaries, and program adapters;
- final CI/CD, packaging, signing, stores, installers, and update channel;
- first supported engineering-program adapter and the limits of external APIs;
- a complete, explicitly approved Design Freeze.

The current Web/PWA and prototype choices are useful evidence but do not settle every final-platform decision unless a later ledger entry explicitly says so.

## Historical decisions changed or challenged after 22 July 2026

| Earlier position | Later repository/user evidence | Governance treatment |
| --- | --- | --- |
| No code or repository work before an explicit Design Freeze | The user subsequently authorized staged Core, P0, P3, reliability, Worker, and Warm Paper work now present on `develop` | Later task-specific authorizations permit that work; whether they collectively constitute the v5 Design Freeze remains pending (`CR-002`) |
| Compare Kotlin and Flutter ink prototypes before selecting the product path | MatePad Gate 0 accepted the current Web/PWA ink path and ADR-008 for the first interface | Adopted for the current Web/PWA execution path; final multi-platform architecture remains open |
| “Year 1 only” execution and deferral of AI Council, Desktop Companion, and CAD/BIM | V5 states a one-contract, complete five-year final scope | Earlier repository entries are historical staging constraints unless the user confirms a contractual reduction; conflict remains open (`CR-001`) |
| Phase 4.5 was specification-only and no code should begin before review | A later authorized Warm Paper interactive shell prototype was merged | Record as a later experimental authorization, not a production Design Freeze or full interface completion |
| Cloudflare Pages/Sites preview assumptions | GitHub became the source of truth and a Workers static preview was used; Sites was frozen | Deployment evidence only; final hosting and delivery architecture remain unsettled |
| P0/P3 interface success could be read as product acceptance | Later user decisions classify both as functional, replaceable prototypes | Their behavior/evidence may be reused; their visual shells are not the final product |
| Phase 4 could be read as complete after automated backup and PDF work | The later device decision records only a partial pass: PDF/Notes pass; Worker ink and full backup/restore remain pending | Phase 4 stays partially open |
| PDF Canvas direction lacked a device result | A later real Arabic PDF test on MatePad recorded visual PASS | Accepted as narrow visual evidence, not acceptance of the full PDF contract |
| Informal single-agent workflow | Later organization uses Planner/Builder/independent Reviewer roles and parallel-safety/file-reservation rules | Seed for explicit Change Ledger ratification; it changes workflow, not contractual product scope |

## Related governance records

- [Conflict Register](./CONFLICT_REGISTER_EN.md)
- [Current Repository Delta](./CURRENT_REPOSITORY_DELTA_EN.md)
- [Gate Mapping](./GATE_MAPPING_EN.md)
- [Change Ledger Seed](./CHANGE_LEDGER_SEED_EN.md)
