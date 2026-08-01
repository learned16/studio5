# Studio5 v5 Current Repository Delta

Baseline inspected: `develop` at `cc6d88ce969bdb7709938ac734ee046e192195c8` on 1 August 2026.

This is an evidence-based snapshot, not an acceptance certificate. “Implemented” requires executable behavior plus verification evidence. A specification, interface, placeholder, schema name, feature flag, or prototype does not by itself count as implementation.

## Classification rules

| Classification | Meaning in this report |
| --- | --- |
| Implemented and verified | Working repository behavior with automated or recorded device evidence for the stated boundary |
| Prototype only | Working experiment that proves behavior or UX direction but is replaceable and not final integration |
| Partially implemented | Some required behavior exists, but a material path, device gate, integration, scale, or acceptance condition remains |
| Not started | No working implementation evidence found on the baseline |
| Decision pending | Work depends on an unresolved product, contract, architecture, provider, or acceptance decision |
| External capability constrained | Completion depends materially on a device, operating system, service, vendor, program API, account, or physical test environment |

## Implemented and verified

| Scope | Evidence boundary | Important limitation |
| --- | --- | --- |
| Core identity, schema, and migration foundations | Stable IDs, schema evolution through the current repository generation, migrations, repository tests | Does not represent all v5 entities or all five-year content |
| Academic foundation | Academic years, semesters, capability/subject profiles, subjects, schedule entries, lectures, tasks, and Today queries in Core | Full assessments, grading, exams, advanced scheduling, and all subject packs are not complete |
| File and notebook foundation | Hashed immutable originals, file artifacts/versions/links, notebooks, ink documents, and revisions with Core tests | Final multi-device artifact sync and full Workspace composition are absent |
| Lecture workflow domain | Capture, closeout, atomic task creation, and lecture inbox behaviors with regression tests | Existing P3 screens remain experimental |
| Local organization services | Search, favorites/recent, offline operation queue, and notes/page-link foundations | Not the complete v5 Knowledge Library, research, or sync contract |
| Core backup/restore/export behavior | Automated Core backup manifest, validation, restore, compatibility, and corruption tests | Full real-device browser backup/restore is still pending |
| P0 ink behavior | Pressure, palm rejection, eraser, undo/redo, zoom/pan, autosave/recovery, revisions, export, and vector-data characterization; prior MatePad device proof | The P0 shell is not final UI and is not currently integrated into the Worker Unified Workspace |
| PDF/Notes narrow device path | PDF selection, local PDF.js navigation/zoom/fit, notes path, and Arabic PDF Canvas LTR visual PASS on MatePad | This is not acceptance of the final PDF annotation/workspace contract |
| Repository delivery discipline | Develop integration branch, scoped PR history, automated Core/P0/P3/build checks, and documented reviewer separation | Final v5 release signing, installers, clean-machine restore, ownership handover, and hardening remain open |

## Prototype only

| Scope | Current evidence | Needed for promotion |
| --- | --- | --- |
| P0 Ink Web | Functional, device-proven ink experiment with persistence and revision behavior | Reusable-engine separation, Unified Workspace integration, device regression, accessibility, and final UX acceptance |
| P3 lecture capture/closeout/library/reliability screens | Functional experimental routes proving lecture, PDF/Notes, and backup UI paths | Replaceable Warm Paper integration, end-to-end data/recovery checks, and final interface acceptance |
| Warm Paper Academic Studio shell | Interactive English-LTR, five-navigation visual prototype; explicitly disconnected from Core, IndexedDB, user files, and external services | Real data adapters, Unified Workspace, error/recovery states, accessibility, responsive/device gates, and product approval |
| Worker static preview | Hosted integration surface for selected P3 routes | P0 Ink inclusion, full backup/restore device gate, final hosting/security/operability decisions |

## Partially implemented

| Scope | Present | Missing material work |
| --- | --- | --- |
| Gate B data safety | Core backup tests, P0 crash recovery, PDF/Notes device evidence | Full Worker ink gate, full real-device backup/restore, low-storage/interruption matrix, larger-scale evidence |
| Unified Workspace | Detailed UX specification, Warm Paper shell, reusable Ink characterization | Production composition of PDF/Canvas/notes/tools, context switching, artifact binding, and final device acceptance |
| Academic platform | Core academic primitives, Today, lecture workflow, files, notebooks, notes, search | Complete grades/assessments/exams, dependency-aware planning, Understanding Rescue, dashboards, and all-year profiles |
| Library and research | PDF intake/viewing, notes, search/favorites/recent foundations | Semantic organization, citation/research workflows, OCR/handwriting decisions, imports, and complete export |
| Projects | Core artifacts/tasks can support future links | Project Engine, milestones, rubrics, critique history, presentation/portfolio paths, and domain acceptance |
| Practice | Navigation/specification foundations exist | Site/field, materials, structural/construction practice workflows and evidence are absent |
| Release and operations | CI and a static Worker preview exist | Final environments, secrets/security policy, observability, packaging, signing, update/rollback, support, and handover |

## Not started

No working baseline implementation evidence was found for these v5 outcomes:

- production Drawing Coach loops, exercise catalog, evaluation, attempt history, and coach analytics;
- Understanding Rescue as an integrated detection/intervention engine;
- complete assessment, grades, exam-mode, prediction, and post-exam analysis;
- Project Engine and full studio/project delivery lifecycle;
- Site & Practical Engine, construction/materials practice, and field evidence workflows;
- Skills, experience, portfolio, employability, and five-year development tracking;
- advanced-year profiles and complete Year 2–5 functional modules/content;
- research/innovation workflows at the full v5 boundary;
- AI Orchestrator/Council, model routing, evaluation, privacy, cost, and offline/degraded operation;
- Desktop Companion, wake/relay, file monitoring, native program adapters, and truthful Pause/Progress integration;
- full cross-device sync/conflict resolution and cloud backup;
- phone/Windows/native packaging, installers, signing, stores, and update channel;
- final full-data export, clean-device restoration, ownership transfer, and Gate G acceptance package at v5 scale.

## Decision pending

- Ratification of the full five-year contractual scope versus the repository’s current-year staging (`CR-001`).
- Definition of the remaining Design Freeze and whether later task approvals freeze only bounded choices (`CR-002`).
- Evidence required for inactive future-year capabilities to count as complete (`CR-003`).
- Promotion criteria from functional prototype to production implementation (`CR-004`).
- Final client/cross-platform stack beyond the current Web/PWA baseline (`CR-005`).
- Final PDF engine and annotation architecture.
- Local database evolution and final sync/conflict protocol.
- Cloud storage/backup, hosting, deployment, and account topology.
- Authentication, encryption, secrets, privacy, telemetry, and retention.
- AI providers/models, budgets, evaluation, and fallback policy.
- Desktop Companion architecture and first engineering-program adapter.
- CI/CD, packaging, signing, installers, update, rollback, and support policy.

## External capability constrained

| Capability | External dependency | Honest acceptance approach |
| --- | --- | --- |
| Pressure, palm rejection, file picker, long-session Ink, PDF rendering | MatePad hardware, stylus, browser/WebView behavior | Keep a physical-device matrix and preserve raw evidence per release candidate |
| Cloud synchronization and backup | Provider APIs, accounts, quotas, network, regional availability | Provider adapter, offline queue, conflict tests, capability detection, full export, and degraded mode |
| AI Council and handwriting/OCR | Model/provider availability, cost, privacy, language quality | Replaceable adapters, evaluation sets, budget/privacy controls, no fabricated offline capability |
| Desktop Companion and remote wake | Windows permissions, background services, network/WOL topology | Explicit installer/service gate, least privilege, observable state, and truthful unavailable state |
| CAD/BIM and engineering-program control | Vendor APIs, versions, licenses, plugins, and automation limits | Per-program capability matrix; never claim generic Pause/Progress where no reliable API exists |
| Installers, stores, signing, and distribution | Platform accounts, certificates, store policies | Record account ownership, reproducible builds, signing custody, install/update/rollback evidence |

## What current evidence must not be used to claim

- A P0 or P3 pass does not approve its visual design.
- The Warm Paper shell does not mean Unified Workspace is integrated.
- A Core entity or future interface contract does not mean the corresponding engine is complete.
- A feature flag does not mean the hidden feature exists.
- Automated backup tests do not close the pending full-device restore gate.
- The narrow PDF Canvas visual PASS does not close all PDF annotation, performance, or accessibility requirements.
- Phase 5 documentation does not mean Phase 5 implementation has started.

See [Gate Mapping](./GATE_MAPPING_EN.md) for the A–G roll-up and [Conflict Register](./CONFLICT_REGISTER_EN.md) for scope ambiguities.
