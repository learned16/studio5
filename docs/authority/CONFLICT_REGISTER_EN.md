# Studio5 Conflict Register

Status: Open governance register. Entries describe genuine conflicts or ambiguities; they are not silent resolutions.

## Provisional interpretation requiring Change Ledger confirmation

The following interpretation was supplied for this governance task. It is **proposed and not yet a ratified replacement for conflicting text**:

1. Final contractual scope: full five-year platform.
2. Engineering execution: staged internal gates and small PRs.
3. Current academic year is active by default.
4. Future-year capabilities use profiles and feature flags.
5. Contracts/placeholders alone do not satisfy final completion.

This interpretation should be ratified as one explicit Change Ledger decision before it is used to close `CR-001`, `CR-003`, or `CR-004`.

## Open conflicts

### CR-001 — Current-year need versus complete five-year build

- **V5 statement A:** section 1.1 says to plan for five years and implement the current-year need; other early sections warn against building all five years immediately.
- **V5 statement B:** sections 43.8 and 45–48 require one contract, one final delivery, all five years and modules present, and no annual return to add missing parts.
- **Repository position:** current roadmaps and decision `D-001` have treated Year 1 as the active implementation scope and deferred advanced years, AI Council, Desktop Companion, and CAD/BIM.
- **Impact:** scope, schedule, architecture, acceptance, and the meaning of “deferred” cannot be made consistent without an explicit decision.
- **Alternatives requiring user decision:** (a) ratify the provisional interpretation above; (b) define a different complete-delivery boundary with an enumerated exclusion list; or (c) amend v5 contract scope explicitly.
- **Status:** Open; no scope reduction is inferred.

### CR-002 — Design Freeze/code prohibition versus later authorized repository progress

- **V5 statement:** sections 33–40 record that Design Freeze was not approved at the document date and prohibit code or Codex implementation before explicit freeze.
- **Later evidence:** `develop` contains user-authorized Core, Ink, lecture, PDF/Notes, backup, Worker, characterization, PDF-direction, and Warm Paper prototype work after 22 July 2026.
- **Impact:** treating the old prohibition as still absolute would invalidate authorized work; treating all later work as a full Design Freeze would falsely settle unresolved architecture choices.
- **Provisional treatment:** later task-specific authorizations legitimize their bounded work. They do not collectively become a final v5 Design Freeze unless the user records that decision.
- **Decision needed:** identify which architecture/product decisions are frozen, which are provisional, and the acceptance evidence required for the remaining Design Freeze.
- **Status:** Open.

### CR-003 — Annual activation versus final-delivery completeness

- **V5 statement A:** the current academic year is active while later years use Profiles, Capability Packs, settings, and feature flags to avoid clutter.
- **V5 statement B:** all five-year modules and prepared subjects must exist in the delivered system, with migrations and final acceptance.
- **Ambiguity:** “present but inactive” could mean fully implemented capability, configuration only, a contract, or a placeholder. These are not equivalent.
- **Impact:** an inactive placeholder could be mistaken for delivered future-year functionality.
- **Provisional treatment:** activation may hide a working, tested capability; it may not substitute for implementation. A contract, schema stub, flag, or empty screen is not final completion.
- **Decision needed:** define per-capability acceptance evidence for inactive future-year functions and what data/content must be prepared at delivery.
- **Status:** Open.

### CR-004 — Prototype gates versus the Full Build contract

- **V5 statement:** prototypes for Ink, PDF, split view, data, restore, and risky integrations are internal engineering gates, while the developer remains responsible for completing all later gates.
- **Repository position:** P0 and P3 have passed important automated/device checks, but their interfaces are explicitly functional experiments. Warm Paper is also an experimental shell without Core integration.
- **Impact:** a prototype PASS may prove feasibility while leaving production integration, accessibility, scale, recovery, packaging, or final UX incomplete.
- **Provisional treatment:** carry verified behavior and evidence forward, but never count a prototype shell as final implementation. Retire it only after its replacement passes the applicable device/data gate.
- **Decision needed:** approve a traceable promotion checklist from prototype evidence to production acceptance.
- **Status:** Open.

### CR-005 — Web/PWA decision versus final cross-platform delivery

- **V5 statement:** final stack, platform packaging, deployment, Desktop Companion, and integration choices remain unsettled and require prototypes/ADRs.
- **Later evidence:** ADR-008 adopts the Web/PWA path for the current interface after the MatePad ink gate; native packaging is deferred to a separate gate.
- **Impact:** Web/PWA suitability for current Ink does not prove Windows installers, deep desktop integration, mobile packaging, background behavior, or five-year support.
- **Decision needed:** state whether ADR-008 is only the current client baseline or the final primary client architecture, and define companion/native acceptance separately.
- **Status:** Open; no rewrite is requested by this register.

### CR-006 — Legacy phase labels versus v5 Gates A–G

- **V5 statement:** its engineering delivery sequence is Gate A through Gate G.
- **Repository position:** existing work uses Gate 0, Phase 2, Phase 3, Phase 4/4.5, Phase 5, Phase 6, and P0/P3 prototype labels.
- **Impact:** matching numbers or labels can imply completion that the v5 gates do not support.
- **Treatment:** use an evidence mapping, not a rename or equivalence claim. See [Gate Mapping](./GATE_MAPPING_EN.md).
- **Decision needed:** ratify the mapping and decide whether future task records should carry both identifiers.
- **Status:** Open.

## Conflict-handling rule

Until a conflict is closed by an explicit ledger decision:

- preserve the broader requirement and the narrower repository evidence separately;
- do not delete, defer, or mark a capability complete by inference;
- do not use implementation progress as contractual amendment;
- do not use a document, interface, schema, placeholder, feature flag, or prototype as proof of final completion;
- record an owner, evidence, and required user decision for closure.

See [Authority Map](./AUTHORITY_MAP_EN.md) for precedence and [Change Ledger Seed](./CHANGE_LEDGER_SEED_EN.md) for proposed post-v5 entries.
