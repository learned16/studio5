# Requirement Traceability

## Current reconciliation — 12 August 2026

PR #17 merged as `2c5d0c6` with GitHub `5/5 PASS` and owner-verified visual,
MatePad, and P4.5 foundation human-gate `PASS`; the production route remains
P3. PR #18 merged as `110d744` with GitHub `5/5 PASS`; PR #19 merged as
`c2991c7` and closed OPS-AUTOPILOT-006. PR #20 merged
`P4.5-UX-IMPLEMENTATION-002` into `develop` as `190851d`.
PR #21 merged `P4.5-UX-IMPLEMENTATION-003` into `develop` as `54c4f48` after
GitHub checks `5/5 PASS`. PR #22 merged `P4.5-UX-IMPLEMENTATION-004` as
`0912af0` with GitHub checks `5/5 PASS`. PR #23 merged `OPS-AUTOPILOT-007` as
`eebeb35`; the automation freeze remains active. `P4.5-UX-IMPLEMENTATION-005`
merged as PR #24 at `454ad9d`. The active product task is
`P4.5-UX-IMPLEMENTATION-006`, a read-only Library-local search interaction.
Only `P4.5-UX-IMPLEMENTATION-007` is active: a read-only Study subject-detail
projection.
IndexedDB remains origin-scoped: an isolated localhost/preview does not prove
access to P3 or production-origin records, and the physical browser-driver read
remains unverified. PDF opening/viewing and Notes are not implemented by this
slice. Ink Batch 3 stays deferred and Phase 5 stays blocked.
Existing CI covers Core/P0/P3/Worker but has no independent P4.5 job; this is a
coverage finding only.

هذه المصفوفة تربط متطلبات السنة الأولى بالمهام والاختبارات والأدلة. لا تستبدل ملف المهمة أو المواصفة.

## عائلات المعرّفات

| البادئة | النوع |
|---|---|
| `S5-FR` | متطلب وظيفي |
| `S5-NFR` | أداء واعتمادية |
| `S5-DATA` | بيانات وملفات ومهاجرات |
| `S5-SEC` | أمان وخصوصية |
| `S5-QA` | جودة واختبارات |
| `S5-UX` | تجربة استخدام وإتاحة |
| `S5-AI` | تكامل AI اختياري؛ ليس أساس الدراسة |
| `S5-GIT` | إدارة الفروع والمراجعة والتاريخ |
| `S5-PREVIEW` | بناء ومعاينة مرتبطة مباشرة بـGitHub |
| `S5-NATIVE` | حدود تسمح بتغليف Native مستقبلاً |
| `S5-UX-FOUNDATION` | بنية معلومات وتصميم واجهة Phase 4.5 بلا تغيير Core |
| `S5-DC-SPEC` | مواصفة Drawing Coach قبل التنفيذ |
| `S5-P6-SPEC` | مواصفة التكامل والإصدار النهائي |

## التتبع الحالي

| Requirement ID | المتطلب | المهمة | الحالة | دليل التحقق |
|---|---|---|---|---|
| `S5-NFR-001` | Ink أساسي مع Autosave/Recovery/Export | P0-INK-WEB | DONE / ADR ADOPTED | 12/12 + Browser smoke + ضغط/Recovery/15 دقيقة/1000 stroke على MatePad |
| `S5-NFR-INK-XFORM-001` | تحويلات Ink/Viewport مستقلة عن DOM مع parity لسلوك P0 | P4-INK-EXTRACT-002 / FIX-2 / PR #11 | COMPLETE / MERGED — DEVICE MULTI-TOUCH NOT CLAIMED | Pure + allocation-free APIs؛ dist import closure وprecache PASS؛ Built browser وOffline reopen PASS؛ Golden parity وCI PASS؛ متابعة pinch الواقعية تبقى لدفعة لاحقة |
| `S5-DATA-001` | Stable IDs وSchema ومهاجرات | P2-CORE-001 | DONE | 7/7 tests |
| `S5-DATA-002` | IndexedDB + Journal + Recovery | P2-CORE-002 | IMPLEMENTED | 14/14؛ Browser smoke المحلي معلق |
| `S5-FR-001` | Repository عام للسنوات والفصول والمواد | P2-CORE-003 | DONE | 19/19 tests |
| `S5-FR-002` | Schedule + Lecture + Task domain | P2-CORE-004 | DONE | 27/27 + `docs/tasks/P2-CORE-004.md` |
| `S5-FR-003` | Today query engine يعمل دون شبكة | P2-CORE-005 | DONE | 33/33 + `docs/tasks/P2-CORE-005.md` |
| `S5-DATA-003` | File intake + hash + duplicate + immutable original | P2-CORE-006 | DONE | 44/44 + `docs/tasks/P2-CORE-006.md` |
| `S5-FR-004` | Notebook basics وربط InkDocument بالسياق | P2-CORE-007 | DONE | 54/54 + `docs/tasks/P2-CORE-007.md` |
| `S5-FR-004-GATE` | ربط واجهة Ink بـNotebook Core على المتصفح والجهاز | P2-GATE-001 | DONE / DEVICE PASS | 15/15 + Build + Sites v4 + MatePad PASS |
| `S5-FR-004-HISTORY` | عرض Ink Revisions ومعاينتها واستعادتها بأمان | P2-GATE-002 | DONE / DEVICE PASS | 15/15 + 54/54 + Build + Sites v5 + البنود الثمانية MatePad PASS |
| `S5-FR-005A` | Lecture Capture وCloseout domain محلي | P3-LF-001 | DONE | Schema v5 + 63/63 Core + 15/15 Ink regression + `0381049` |
| `S5-FR-005B` | تحويل Capture إلى Task + Lecture Inbox محلي | P3-LF-002 | DONE | 69/69 Core + 15/15 Ink regression + `e24d30e`؛ لا Schema جديد |
| `S5-FR-005C-CAPTURE` | واجهة Capture تجريبية مستقلة | P3-LF-003 | DONE | 4/4 UI + 69/69 Core + 15/15 Ink + Sites v1 |
| `S5-FR-005C-CLOSEOUT` | واجهة Closeout تجريبية مستقلة | P3-LF-004 | DONE / EXPERIMENTAL | 8/8 UI + 69/69 Core + 15/15 Ink + Sites v2 |
| `S5-FR-005C-SEARCH` | Search وFavorites/Recent محلية | P3-LF-005 | DONE | Schema v6 + 76/76 Core + 15/15 Ink + 8/8 Lecture UI |
| `S5-NFR-OFFLINE-001` | Offline Operation Queue دائم وقابل للاستعادة | P3-LF-006 | DONE | Schema v7 + 83/83 Core + 15/15 Ink + 8/8 Lecture UI |
| `S5-DATA-PDF-001` | PDF immutable مع Note مستقلة مرتبطة بالملف والصفحة | P3-LF-007 | IMPLEMENTED | Schema v8 + 88/88 Core |
| `S5-FR-005C-LIBRARY` | واجهة PDF/Notes/Search/Favorites/Recent تجريبية | P3-LF-007 | DONE / DEVICE PASS / UI EXPERIMENTAL | MatePad: رفع PDF والملاحظات وإعادة الفتح بلا فقد أو تكرار |
| `S5-UX-PDF-PICKER-001` | منتقي PDF يستقبل اللمس مباشرة على MatePad/WebView | P3-LF-008 | DONE / DEVICE PASS | MatePad PDF upload PASS بتاريخ 2026-07-31 |
| `S5-UX-PDF-PICKER-002` | حقل ملفات نظام أصلي ظاهر ومتوافق مع MIME العام على MatePad | P3-LF-009 | DONE / DEVICE PASS | MatePad native file selection/upload PASS |
| `S5-UX-PDF-VIEWER-001` | عرض PDF داخلي لا يعتمد على عارض WebView مع تنقل وZoom وOffline assets | P3-LF-010 | DONE / DEVICE PASS | MatePad navigation + Zoom + Fit width PASS |
| `S5-FR-005C` | Lecture Flow وSearch وFavorites/Recent وOffline Queue | Phase 3 | PDF/NOTES DEVICE PASS / UI NOT FINAL | Workers Build `6e7ced6d` + MatePad reload/close/reopen PASS |
| `S5-DATA-004` | Backup/Restore/Full Export | P4-HARD-001 | CORE HARDENED + OWNER-VERIFIED REAL-DEVICE PASS | 100/100 Core + Schema 7→8 regression دليل آلي؛ المالك أكد Full Backup/Verify/Restore device PASS |
| `S5-UX-BACKUP-001` | تنزيل وفحص واستعادة Backup من واجهة MatePad | P4-REL-002 | OWNER-VERIFIED REAL-DEVICE PASS / UI EXPERIMENTAL | إفادة المالك تشمل Full Backup/Verify/Restore ورفض النسخة التالفة والفشل الآمن؛ لا تفاصيل جهاز مخترعة |
| `S5-DATA-005` | هوية تخزين متصفح موحدة ومهاجرة آمنة للأسماء القديمة | P4-REL-003 | AUTOMATED PASS + OWNER-VERIFIED REAL-DEVICE PASS | أدلة المهاجرة الآلية منفصلة عن إفادة المالك للمجموعة الكاملة على الجهاز |
| `S5-QA-P4-001` | توافق Backup القديم وتشغيل فحوص Phase 4 آلياً قبل Phase 5 | P4-HARD-001 / P4-P45-RECONCILIATION | COMPLETE — AUTOMATED/CI PASS + OWNER-VERIFIED REAL-DEVICE PASS | Automated/CI دليل مستقل؛ المالك أكد Ink/pen/palm/save-reopen/Backup/corrupt/low-storage/failure-safe وبقية مجموعة Phase 4؛ PR #7 دليل PDF Canvas مستقل |
| `S5-UX-P45-ROUTING-001` | توجيه Phase 4.5 بعد مصالحة الأدلة من دون اختراع نتائج جهاز | P4-P45-RECONCILIATION / PR #16 | COMPLETE / MERGED | B `REVISE → fix → PASS` وmutation guard وCI ناجحة؛ merge `261c1e3`؛ Phase 4 كاملة وPhase 4.5 التالية وInk Batch 3 مؤجل |
| `S5-QA-AUTOPILOT-001` | تسليم Codex محكوم مع مراجعة B بلا كتابة وmutation guard حتمي | OPS-AUTOPILOT-001 / PR #12 | COMPLETE / MERGED | Runtime Discovery PASS وفق العقد المصحح؛ B mutation guard PASS؛ tooling 46/46 وFull regression PASS؛ GitHub checks 5/5 PASS |
| `S5-QA-AUTOPILOT-002` | مراجعة B معزولة بفرض read-only من invocation مستقلة | OPS-AUTOPILOT-002 | DEFERRED BY OWNER — API AUTOMATION LATER | التصميم ومعايير القبول وخطة regression محفوظة؛ لا `OPENAI_API_KEY` الآن وغيابه قرار تشغيلي لا defect |
| `S5-QA-AUTOPILOT-003` | تحقق مسار التسليم باشتراك Codex الحالي فقط | OPS-AUTOPILOT-003 / PR #14 | COMPLETE / MERGED | Supervisor/A/B وmutation guard وcheck selection وscope PASS؛ PR #14 merged at `1043d46` بعد GitHub CI 5/5 PASS؛ C غير مطلوب؛ لا API key ولا Full access ولا auto-merge ولا Production |
| `S5-QA-AUTOPILOT-004` | توجيه أمر المالك `continue` من الحقيقة الحية إلى حلقة تسليم واحدة محكومة | OPS-AUTOPILOT-004 / PR #15 | COMPLETE / MERGED | B `REVISE → fix → PASS` مع mutation guard PASS؛ GitHub checks 5/5؛ merged into `develop` as `0ffc446`؛ no auto-merge or Production |
| `S5-QA-AUTOPILOT-006` | اختيار فحوص محلية دقيقة ومشغّلة فعلياً مع تجميد تحسينات الأتمتة غير الضرورية | OPS-AUTOPILOT-006 / PR #19 | COMPLETE / MERGED | Merge `c2991c7`؛ check selection and evidence reconciliation integrated; future optimization stays frozen unless an approved trigger exists |
| `S5-QA-AUTOPILOT-007` | Proven-pattern routing calibration | OPS-AUTOPILOT-007 | IN PROGRESS | One-time material recurring-bottleneck exception, evidenced from requested R2/high routes in P4.5 task cards 002/003/004; no effective-runtime value is claimed when NOT EXPOSED; after integration the freeze remains and product routing returns to Phase 4.5 |
| `S5-GIT-001` | `develop` قاعدة التجميع مع فروع قصيرة وPR إلى develop | PRE-P5-FOUNDATION-001 | READY FOR USER REVIEW / PR CI PASS | `develop@3fbc776` + PR #2 + GitHub Actions 3/3 + `BRANCH_AUDIT.md` + `GIT_WORKFLOW_AR.md` |
| `S5-PREVIEW-001` | Preview يبني SHA من GitHub ولا يعتمد Sites | PRE-P5-FOUNDATION-001 | DONE / DEPLOYED FROM DEVELOP | `develop@ed1d175` → Workers Build `6e7ced6d` |
| `S5-PREVIEW-002` | فحص حزمة P3 الساكنة وحدود Cloudflare والمسارات والأصول قبل الربط | P4-PREVIEW-001 | DONE / STATIC BUILD VERIFIED | PR #3 CI + 404/PDF/SW contracts + Production build PASS |
| `S5-PREVIEW-003` | إعداد Workers Static Assets وWorkers Builds بإصدار Wrangler مثبت وفحص بلا نشر | P4-WORKERS-PREVIEW-001 | DONE / DEPLOYED / OWNER-VERIFIED REAL-DEVICE PASS | Wrangler/build evidence آلي؛ owner device evidence منفصل ولا يُنسب إلى Build SHA غير supplied |
| `S5-UX-FOUNDATION-001` | Warm Paper Academic Studio وEnglish LTR shell والتنقل الرئيسي الموحد | P4.5-UX-SPEC-001 | ADOPTED / INCREMENTAL IMPLEMENTATION AUTHORIZED | `Today / Study / Projects / Practice / Library` + اتجاه تلقائي لمحتوى المستخدم؛ Warm Paper reference only |
| `S5-UX-P45-SHELL-001` | App Shell وتنقل Responsive معزولان من دون Core أو Ink | P4.5-UX-IMPLEMENTATION-001 / PR #17 | COMPLETE / MERGED | PR #17 merged as `2c5d0c6` after GitHub 5/5 PASS؛ OWNER-VERIFIED visual/MatePad human gate PASS؛ B `REVISE → repair → PASS` وmutation guard PASS؛ production route ما زال P3 ولا route cutover أو Phase 5 |
| `S5-UX-P45-TODAY-001` | عرض Today للقراءة فقط من إسقاط Core السلطوي داخل سطح P4.5 المعزول | P4.5-UX-IMPLEMENTATION-002 / PR #20 | COMPLETE / MERGED | merged into `develop` as `190851d`؛ facade يكشف `queryToday` فقط؛ same-origin وphysical-browser boundaries محفوظة؛ لا route cutover أو mutators أو Phase 5 |
| `S5-UX-P45-STUDY-001` | عرض مواد Study للقراءة فقط من قائمة Core السلطوية داخل سطح P4.5 المعزول | P4.5-UX-IMPLEMENTATION-003 / PR #21 | COMPLETE / MERGED | merged into `develop` as `54c4f48` after GitHub checks 5/5 PASS؛ facade يكشف `listSubjects` فقط؛ يحفظ ترتيب Core وescaping و`dir="auto"`؛ same-origin boundary محفوظة؛ لا route cutover أو mutators أو Phase 5 |
| `S5-UX-P45-LIBRARY-001` | عرض فهرس Library للقراءة فقط من بحث Core السلطوي داخل سطح P4.5 المعزول | P4.5-UX-IMPLEMENTATION-004 / PR #22 | COMPLETE / MERGED | merged into `develop` as `0912af0` after GitHub checks 5/5 PASS؛ facade يكشف بحث `AcademicRepository.searchLibrary` فقط؛ same-origin وphysical-browser boundaries محفوظة؛ لا PDF/file-byte opening أو viewer أو Notes أو Core/P3/Worker/Schema/Storage/Ink/route cutover/Phase 5 |
| `S5-UX-P45-LIBRARY-NOTE-001` | عرض تفصيل Note داخل Library للقراءة فقط | P4.5-UX-IMPLEMENTATION-005 / PR #24 | COMPLETE / MERGED | `454ad9d`; frozen `AcademicRepository.getNote` facade; no Workspace/Notes-write parity |
| `S5-UX-P45-LIBRARY-SEARCH-001` | بحث Library المحلي للقراءة فقط | P4.5-UX-IMPLEMENTATION-006 | LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING | frozen `searchLibrary({query,limit})` only; local loading/empty/error/retry; no global search or mutators |
| `S5-UX-P45-STUDY-DETAIL-001` | عرض تفصيل Study subject للقراءة فقط | P4.5-UX-IMPLEMENTATION-007 | LOCAL IMPLEMENTATION VERIFIED — PARENT REVIEW PENDING | frozen `getSubject` facade; inline states and stale-response protection; no mutators |
| `S5-NATIVE-001` | فصل Core عن Browser adapters للتغليف لاحقاً | PRE-P5-FOUNDATION-001 | DOCUMENTED | `NATIVE_READINESS_AR.md` |
| `S5-DC-SPEC-001` | مواصفة Drawing Coach القابلة للقياس | PRE-P5-FOUNDATION-001 | READY FOR USER REVIEW | `PHASE_5_DRAWING_COACH_SPEC_AR.md` |
| `S5-P6-SPEC-001` | مواصفة التكامل والاستقرار وRelease Candidate | PRE-P5-FOUNDATION-001 | READY FOR USER REVIEW | `PHASE_6_FINAL_INTEGRATION_SPEC_AR.md` |
| `S5-FR-006` | Drawing Coach Lite | Phase 5 | BACKLOG CURRENT YEAR | P0 أساس Ink فقط |
| `S5-FR-007` | Understanding Rescue | Year One | BACKLOG CURRENT YEAR | المواصفة في `UNDERSTANDING_RESCUE.md` |
| `S5-FR-008` | Project Lite وواجبات وملاحظات الدكتور | Year One | BACKLOG CURRENT YEAR | النموذج موجود في `DATA_MODEL.md` |
| `S5-FR-009` | الدرجات ومسار 90+ | Year One | BACKLOG CURRENT YEAR | يحتاج Task Brief لاحقًا |

## قاعدة التحديث

- لا تتحول حالة إلى `DONE` قبل Commit وPush ونجاح التحقق.
- المتطلبات السابقة تبقى مرتبطة بأدلتها ولا تُعاد كتابتها بأثر رجعي.
- أي تأجيل أو تغيير معنى يسجل في `DECISION_LOG.md`.
