# Studio5 Current Authority Record

Status: Current and resolved authority record, effective 1 August 2026 and
updated 9 August 2026.

This document records the explicit decisions resolved by the user and supervisor after the publication of [Studio5 One-Time Full Build Specification v5.0](./Studio5_One_Time_Full_Build_Spec_v5_AR.md). It updates only the affected parts of v5. The remainder of v5 stays authoritative.

The authoritative v5 repository copy remains unchanged:

- File: `Studio5_One_Time_Full_Build_Spec_v5_AR.md`
- SHA-256: `59e93b0430bc9efc0e801732d575bfc29ef72d7cc474cee9081c33c9d7619ebe`

## Authority order

Apply the following order:

1. The latest explicit user decision recorded with a clear date and scope.
2. Studio5 Full Build Specification v5 for the rest of the scope.
3. Evidence, tests, and pull requests as proof of implementation status.
4. Older documents as historical context only.

A later decision changes only the part with which it conflicts. It does not cancel the full specification.

## Resolved decisions

### 1. Five-year scope

Studio5 is a permanent five-year platform.

The architecture and contracts required for five-year expansion are built now, while production implementation prioritizes the current academic year's needs first.

Later-year capabilities are prepared through:

- stable contracts;
- an extensible data model;
- Subject Profiles;
- feature flags;
- documented extension points.

The complete details and interfaces of later academic years are not built before their academic need.

### 2. Design Freeze

The restriction against starting code before Design Freeze was an initial condition. It was legitimately superseded by the user's explicit approval and the start of implementation.

The project is not stopped again because of that initial condition. Any new major scope still requires a clear design decision before implementation.

### 3. Implementation versus activation

At final delivery, required capabilities must be implemented and tested.

The current academic year is enabled by default. Later-year capabilities may be disabled through Profiles or feature flags.

The governing rules are:

- Implemented does not always mean enabled.
- Disabled does not mean missing.
- Placeholder does not mean implemented.

### 4. Prototypes versus Full Build

P0 and P3 are functional prototypes used to prove technology and reduce risk. They are not the final design or final product.

Successful engines, logic, behavior, and tests may be reused. The old prototype interfaces are not adopted automatically.

### 5. Platform strategy

Web/PWA is the current implementation and proof path. It is not a decision that the final Studio5 platform is Web-only.

The final multi-platform scope remains active under v5 and is delivered in stages across:

- the MatePad workflow;
- the Windows companion;
- mobile capture;
- Web/PWA capabilities.

The current priority is:

`Core + Data contracts + Primary MatePad workflows`

Expansion follows the project gates.

### 6. Gates and phases

Gates A–G are the project's top-level map. Historical Phase labels remain smaller implementation units inside those Gates and are not a separate final roadmap.

- Phase 4 is part of Gate B.
- Phase 4.5 UX is part of Gate C.
- Phase 5 Drawing Coach is part of Gate D.
- Phase 5 is not the end of Studio5.

## Current product and implementation decisions

| Area | Current decision or verified state |
| --- | --- |
| Visual direction | `Warm Paper Academic Studio` |
| Product shell | English and LTR |
| Arabic and mixed user content | Automatic RTL/LTR direction |
| Main navigation | `Today / Study / Projects / Practice / Library` |
| Phase 4 | `COMPLETE — AUTOMATED/CI PASS + OWNER-VERIFIED REAL-DEVICE PASS` |
| PDF Canvas | `AUTOMATED PASS / CLOUDFLARE PREVIEW PASS / MATEPAD VISUAL PASS` |
| PDF Canvas evidence | [PR #7](https://github.com/learned16/studio5/pull/7), dated 2026-08-01; GitHub-verified as merged into `develop` |
| P0 Ink characterization | Completed and merged as tests and documentation |
| Warm Paper visual direction | Approved prototype/reference |
| Arabic content PR | [PR #6](https://github.com/learned16/studio5/pull/6) closed without merge |

The product decisions above do not convert P0, P3, or the Warm Paper reference into final product interfaces.

## Codex operating model

The approved organization is:

- `A — Production`
- `B — Review & QA`
- `C — Prototype & Architecture`

The operating rules are:

- Blockers first.
- Parallel work only when marked `PARALLEL-SAFE`.
- Use worktrees and separate branches.
- Shared files are owned by one task at a time.
- Codex executes; the user and supervisor decide.
- Every task stops at: `Commit + Push + Draft PR + Tests + STOP`.
- No automatic merge.

### Adaptive model and reasoning routing — 9 August 2026

The owner approves routine Supervisor selection of the appropriate available
model capability and reasoning effort for each A, B, or C invocation. The
Supervisor classifies complexity, ambiguity, production risk, code/context
volume, architectural judgment, review/security sensitivity, and whether work
is repetitive or mechanical before each spawn. It uses the lowest sufficient
available setup, with the highest safety-relevant dimension taking precedence;
volume alone does not justify maximum reasoning.

The policy is capability-based and graceful: no model or reasoning level is
globally pinned, no reusable policy relies on a concrete model identifier, and
the best safe available fallback is used when a preferred option is absent. The
owner may override routing for one exceptional task without creating a global
pin. The chosen tier never reduces required tests, B review, scope guards, or
human gates. Delivery evidence records the role, classification, tier,
requested/effective transient runtime values, fork context, and fallback or
override; unavailable values are recorded as `NOT EXPOSED` rather than guessed.

### Automation optimization freeze — 11 August 2026

The owner approves one bounded delivery-efficiency optimization in
`OPS-AUTOPILOT-006`. After it is integrated, the Supervisor must return a bare
`continue` to the next eligible Phase 4.5 product-critical-path task.

No further automation or delivery-cost optimization may be selected merely to
seek speculative savings. A later optimization needs one of: a correctness or
safety concern, a broken workflow, a material recurring bottleneck, or an
explicit owner request. This freeze does not reduce tests, B review, scope
guards, human gates, or existing GitHub CI, and it does not authorize Phase 5.

## Automation spending boundary — 9 August 2026

The owner has deferred API-funded automation. Studio5 will not add an
`OPENAI_API_KEY` or use the OpenAI API or paid Codex GitHub Action automation
at this stage. The absence of that repository secret is an intentional owner
decision, not a defect or a current remediation item.

Until the owner explicitly authorizes spending on automation infrastructure,
Studio5 uses the existing Codex subscription through one Studio5 Project and
one supervisor with:

- `A — Production` for implementation;
- an independent behaviorally no-write `B — Review & QA` reviewer wrapped by
  the deterministic repository mutation guard;
- `C — Prototype & Architecture` only when needed;
- native tests, installed guards, and the existing GitHub CI;
- push and Draft Pull Request delivery without automatic merge.

This decision defers, but does not cancel, the independently invoked enforced
read-only design in `OPS-AUTOPILOT-002`. Full access remains forbidden. Its
original restriction on Phase 4.5 work was superseded by the later owner
decision below; Phase 5 remains blocked.

## Product-stage routing — 9 August 2026

The owner's latest explicit evidence update confirms that the full Phase 4
real-device test set previously discussed was completed and passed. The
canonical device-evidence label is `OWNER-VERIFIED REAL-DEVICE PASS`, and the
canonical Phase 4 status is
`COMPLETE — AUTOMATED/CI PASS + OWNER-VERIFIED REAL-DEVICE PASS`.

The authoritative routing is now:

- Automated tests and CI remain software evidence; they do not replace the
  owner's real-device evidence.
- PR #7 separately provides PDF Canvas
  `AUTOMATED PASS / CLOUDFLARE PREVIEW PASS / MATEPAD VISUAL PASS`. That evidence
  is not the source of the broader Phase 4 device PASS.
- The owner's `OWNER-VERIFIED REAL-DEVICE PASS` covers the previously discussed
  Phase 4 real-device set, including Ink behavior, pen/palm rejection, Ink
  save/reopen, full Backup/Verify/Restore, corrupt-backup rejection,
  low-storage/failure-safe behavior, and the other required real-device Phase 4
  checks from that session.
- No build SHA, measurements, file counts, exact step log, or implementation
  surface is inferred where the owner did not supply it.
- Phase 4.5 UX/UI Redesign is the next owner-prioritized product stage and may
  begin incrementally through small, independently gated tasks.
- Phase 5 remains blocked until Phase 4.5 and the required gates are handled.
- Ink extraction Batch 3 must not be selected ahead of Phase 4.5 merely because
  an older status document listed it next.

Ink Batch 3 is not a prerequisite for the Phase 4.5 shell/navigation,
read-only Today/Study, or Library/PDF/Notes adapter slices. It is required later
inside the full Batches 3–7 dependency chain before the specific live-Ink
Unified Workspace slice; Batch 3 alone is not sufficient. This routing decision
does not authorize or start Batch 3.

## User reference-package delivery rule

Repository documents may be divided internally when technically useful.

Any future reference package delivered to the user must be consolidated into one Arabic file named:

`Studio5_Master_Current_AR.md`

That file is not created by this governance update.
