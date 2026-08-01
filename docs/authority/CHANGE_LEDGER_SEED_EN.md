# Studio5 Change Ledger Seed

Status: Proposed seed for canonical Change Ledger review. These entries preserve known post-v5 decisions and evidence; this file does not silently ratify scope changes. Each entry must be confirmed, assigned a durable source, and copied into the canonical ledger through a separately authorized governance change.

## Entry format

Every adopted entry should retain: ID, date, source, exact decision, affected authority, scope, rationale, impact, status, and supersession link.

## Proposed entries

### CL-V5-001 — Full-build scope with staged engineering execution

- **Date:** 2026-08-01 governance seed; decision date requires confirmation.
- **Proposed decision:** Final contractual scope is the full five-year platform. Engineering execution uses staged internal gates and small PRs. The current academic year is active by default; future-year capabilities use profiles and feature flags. Contracts and placeholders alone do not satisfy final completion.
- **Affected authority:** V5 sections 1.1, 43.8, and 45–48; repository decisions `D-001` and `D-004`.
- **Impact:** Resolves the intended meaning of build scope, annual activation, and final acceptance without authorizing a monolithic implementation.
- **Status:** **Requires explicit user ratification.** Intended to resolve `CR-001`, `CR-003`, and part of `CR-004`.

### CL-V5-002 — Warm Paper Academic Studio

- **Date:** 2026-07-31.
- **Known later decision:** `Warm Paper Academic Studio` is the product’s visual/interaction direction.
- **Boundary:** Existing P0/P3 visual shells are not inherited as the product design. The current Warm Paper shell is still an experimental prototype until integrated and accepted.
- **Impact:** Guides interface replacement without changing Core data meaning or deleting user data.
- **Status:** Known adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-003 — English LTR product shell

- **Date:** 2026-07-31.
- **Known later decision:** Product chrome and shell use English left-to-right layout.
- **Boundary:** This does not force user-created Arabic content or rendered document content into LTR.
- **Impact:** Applies to navigation, controls, shell layout, and product copy unless a later localization decision changes it.
- **Status:** Known adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-004 — Automatic Arabic and mixed-content direction

- **Date:** 2026-07-31.
- **Known later decision:** User-authored Arabic or mixed-language content selects direction automatically while the product shell remains English LTR.
- **Boundary:** PDF Canvas rendering may require an explicit renderer direction independent of surrounding DOM direction; the MatePad Arabic PDF Canvas check later passed.
- **Impact:** Requires content-level direction handling and regression tests rather than a global RTL switch.
- **Status:** Known adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-005 — Five-interface navigation

- **Date:** 2026-07-31.
- **Known later decision:** Primary navigation is `Today / Study / Projects / Practice / Library`.
- **Boundary:** Navigation labels do not prove the engines behind them are implemented. Drawing Coach belongs under Practice but is not started by adding its entry point.
- **Impact:** Provides a stable information-architecture frame for Unified Workspace and later gates.
- **Status:** Known adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-006 — P0 and P3 are functional prototypes

- **Date:** 2026-07-31, with later characterization evidence.
- **Known later decision:** P0 Ink and P3 lecture/PDF/reliability interfaces are functional, replaceable prototypes. Preserve verified capabilities and data; do not adopt their old visual design as the final product.
- **Impact:** Separates behavior reuse from UI reuse and prevents prototype PASS from becoming final product acceptance.
- **Status:** Known adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-007 — Phase 4 is only a partial gate pass

- **Date:** 2026-07-31.
- **Known later decision:** Phase 4 status is `PARTIAL DEVICE GATE PASS — PDF/NOTES PASS; INK AND FULL BACKUP/RESTORE PENDING`.
- **Impact:** Automated Core backup success and PDF/Notes device success cannot close the complete reliability/device gate. Worker Ink and full device backup/restore remain required.
- **Status:** Known corrected/adopted user decision; pending canonical v5 ledger transcription.

### CL-V5-008 — PDF Canvas direction MatePad visual PASS

- **Date:** Later than the 2026-07-31 partial gate; exact test date/source should be preserved from the device report/PR record.
- **Known later evidence/decision:** A real Arabic PDF rendered through PDF.js Canvas on MatePad passed visual direction verification after explicit LTR Canvas handling.
- **Boundary:** This is narrow visual evidence. It does not approve the entire PDF engine, annotation workflow, scale, accessibility, or final Workspace.
- **Status:** Evidence accepted for the bounded PDF Canvas direction case; pending canonical ledger transcription with exact source.

### CL-V5-009 — Three-Codex organization and parallel safety

- **Date:** Post-v5 workflow decision; exact date/source requires confirmation.
- **Known later decision:** Work is organized across distinct Planner, Builder, and independent Reviewer responsibilities. Parallel work uses separate branches/tasks and non-overlapping reserved files; two agents do not edit the same branch or task files concurrently.
- **Boundary:** The independent Reviewer begins with evidence-based review and does not silently rewrite the Builder’s report or branch. Integration follows the designated integration branch and user-approved merge policy.
- **Impact:** Reduces branch/file collisions, preserves independent review, and keeps small PR evidence attributable.
- **Status:** Known operating rule; **requires source/date ratification** in the canonical ledger.

### CL-V5-010 — Later authorized work does not automatically equal full Design Freeze

- **Date:** 2026-08-01 governance seed.
- **Proposed decision:** Post-22-July user-authorized tasks validate their bounded implementation choices. They do not collectively settle every v5 unresolved technical decision or constitute a complete Design Freeze without an explicit ledger entry.
- **Impact:** Reconciles legitimate repository progress with the v5 freeze language while keeping unresolved choices visible.
- **Status:** **Requires explicit user ratification.** Intended to resolve `CR-002`.

## Ratification checklist

Before moving an entry into the canonical ledger:

- attach the original user instruction, approved PR, device report, or decision document;
- confirm its exact date and whether it is contractual or implementation-only;
- list the v5 requirements and earlier decisions it changes;
- record what remains explicitly unresolved;
- obtain the user’s approval for entries marked “requires explicit user ratification.”

See [Authority Map](./AUTHORITY_MAP_EN.md), [Conflict Register](./CONFLICT_REGISTER_EN.md), and [Gate Mapping](./GATE_MAPPING_EN.md).
