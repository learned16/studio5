# Studio5 v5 Gate Mapping

Baseline: `develop` at `cc6d88ce969bdb7709938ac734ee046e192195c8` on 1 August 2026.

The repository’s historical Phase/P labels are not aliases for v5 Gates A–G. This map attaches existing evidence to the broader v5 gates without renaming work or claiming completion.

## Gate summary

| V5 gate | Current status | Evidence present | Material gap before gate completion |
| --- | --- | --- | --- |
| Gate A — Environment and decisions | **Partially implemented / Decision pending** | Repository, `develop` integration, scoped tasks/PRs, CI discipline, Web/PWA ADR evidence, governance/SOP, current v5 authority copy | Ratified authority reconciliation, explicit remaining Design Freeze, final stack/platform/provider/security/deployment decisions, complete requirement baseline |
| Gate B — Ink/PDF/data proof | **Partially implemented** | MatePad P0 pressure/palm/eraser/recovery proof; reusable behavior characterization; PDF.js/file-picker/navigation and Arabic Canvas visual PASS; Core backup tests | P0 inside Worker/Unified Workspace, full real-device backup/restore, low-storage/interruption and scale matrix, final split-view/annotation proof, complete export/reopen evidence on target environments |
| Gate C — Core and academic platform | **Partially implemented** | Core IDs/schemas/migrations/repository, academic primitives, Today, lecture workflow, files/notebooks/revisions, notes/search/offline queue, backup | Complete academic planning, assessments/grades/exams, Understanding Rescue, all five-year profiles/packs, final data/sync/security architecture, integrated accepted interfaces |
| Gate D — Drawing/projects/practice | **Not started at production scope; foundations/prototypes only** | P0 reusable Ink evidence, project-capable base artifacts/tasks, Warm Paper/Unified Workspace specification, Drawing Coach specification | Drawing Coach implementation, Project Engine, practice/site/materials workflows, critique/rubric/history, production Workspace and device acceptance |
| Gate E — Advanced years and AI | **Not started / Decision pending** | Architecture goals and documents only | Working Year 2–5 capabilities/content, Skills/Experience/Research engines, AI Orchestrator/Council, model evaluation/privacy/cost/fallback, acceptance evidence |
| Gate F — Desktop and integrations | **Not started / External capability constrained** | Native-readiness notes and adapter principles only | Windows/Desktop Companion, installers, wake/relay, program/file adapters, CAD/BIM capability matrix, packaging/signing/device tests |
| Gate G — Hardening and final delivery | **Partially started, far from final acceptance** | Automated unit/regression/build checks, narrow device reports, source in GitHub, prototype deployment evidence | Full security/privacy/performance/accessibility/recovery matrix, clean build/install/restore, reproducible release, no blocker/high defects, all ownership/accounts/docs/installers/export, signed tag/hash and final user acceptance |

## Gate A — Environment and decisions

Existing work provides a functioning repository, integration branch, automated checks, bounded work records, and several ADR/decision entries. This governance package anchors v5 but does not itself approve the unresolved Design Freeze. Gate A remains open until contract scope, stack/platform boundaries, data/sync/security, providers, deployment, and acceptance ownership are explicitly settled.

## Gate B — Ink/PDF/data proof

The strongest evidence is the P0 physical-device Ink gate, the new characterization lock, PDF.js and file-picker device passes, the Arabic PDF Canvas LTR visual PASS, and automated Core backup/restore tests. The current Phase 4 status is still partial: Ink is not in the Worker and full browser backup/restore has not passed the physical-device gate. Therefore Gate B is not closed.

## Gate C — Core and academic platform

The repository contains substantial reusable Core foundation and several verified Year 1 workflows. V5 Gate C is broader: it requires the complete academic platform, all-year configuration, assessment/grade/exam behavior, Understanding Rescue, integrated accepted interfaces, and settled data/sync/security contracts. Those gaps prevent a completion claim.

## Gate D — Drawing, projects, and practice

Current Ink and shell work are enabling evidence, not Gate D completion. Drawing Coach, Project Engine, critique/project history, and practice/site/material workflows remain unimplemented at production scope.

**The repository’s current Phase 5 (Drawing Coach Lite) is one portion of v5 Gate D. It is not the end of Studio5, not Gate E–G, and not final delivery.** Starting or completing Phase 5 cannot be reported as completing the full v5 platform.

## Gate E — Advanced years and AI

V5 requires advanced years, accumulated skills/experience, research/innovation, and AI behavior with evaluation and safe degradation. Current documents and future contracts are planning evidence only. Implementation and verification have not started.

## Gate F — Desktop and integrations

Desktop Companion, Windows packaging, wake/relay, file monitoring, and engineering-program adapters depend on unresolved technology and external APIs. Each must use capability detection and honest fallbacks; a generic integration claim is not acceptable where vendor APIs cannot support it.

## Gate G — Hardening and final delivery

Existing CI and device reports are useful early hardening evidence. Gate G remains open until the complete platform passes security, privacy, accessibility, performance, failure/recovery, scale, clean-machine build/install/restore, ownership handover, full export, installer/update/rollback, and final acceptance requirements. Final source must be tied to an approved commit/tag/hash and reproducible evidence.

## Promotion rule

Evidence moves upward only when its scope is explicit:

1. Prototype feasibility evidence may satisfy a risk question.
2. Reusable Core behavior may satisfy a bounded domain requirement.
3. Integrated device evidence may satisfy an acceptance case.
4. None of these alone satisfies a broader gate or final delivery.

Related records: [Current Repository Delta](./CURRENT_REPOSITORY_DELTA_EN.md), [Conflict Register](./CONFLICT_REGISTER_EN.md), and [Change Ledger Seed](./CHANGE_LEDGER_SEED_EN.md).
