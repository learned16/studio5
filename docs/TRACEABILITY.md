# Requirement Traceability

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
| `S5-DC-SPEC` | مواصفة Drawing Coach قبل التنفيذ |
| `S5-P6-SPEC` | مواصفة التكامل والإصدار النهائي |

## التتبع الحالي

| Requirement ID | المتطلب | المهمة | الحالة | دليل التحقق |
|---|---|---|---|---|
| `S5-NFR-001` | Ink أساسي مع Autosave/Recovery/Export | P0-INK-WEB | DONE / ADR ADOPTED | 12/12 + Browser smoke + ضغط/Recovery/15 دقيقة/1000 stroke على MatePad |
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
| `S5-FR-005C-LIBRARY` | واجهة PDF/Notes/Search/Favorites/Recent تجريبية | P3-LF-007 | DEPLOYED V3 / DEVICE GATE PENDING | 13/13 UI + Build + 15/15 Ink + Sites v3 |
| `S5-UX-PDF-PICKER-001` | منتقي PDF يستقبل اللمس مباشرة على MatePad/WebView | P3-LF-008 | DEPLOYED V5 / USER RETEST PENDING | 14/14 UI + 88/88 Core + 15/15 Ink + تحقق الواجهة المنشورة |
| `S5-UX-PDF-PICKER-002` | حقل ملفات نظام أصلي ظاهر ومتوافق مع MIME العام على MatePad | P3-LF-009 | DEPLOYED V6 / DEVICE RETEST PENDING | 14/14 UI + 88/88 Core + 15/15 Ink + Sites v6 |
| `S5-UX-PDF-VIEWER-001` | عرض PDF داخلي لا يعتمد على عارض WebView مع تنقل وZoom وOffline assets | P3-LF-010 | DEPLOYED WITH P4 V9 / DEVICE RETEST PENDING | 22/22 UI + 99/99 Core + 15/15 Ink + Build |
| `S5-FR-005C` | Lecture Flow وSearch وFavorites/Recent وOffline Queue | Phase 3 | IMPLEMENTATION COMPLETE / DEVICE GATE PENDING | جميع الدفعات منشورة؛ ينتظر فقط تقرير `P3-PDF-NOTES-MATEPAD-TEST-REPORT.md` |
| `S5-DATA-004` | Backup/Restore/Full Export | P4-HARD-001 | CORE HARDENED / DEVICE GATE PENDING | 100/100 Core + Schema 7→8 regression |
| `S5-UX-BACKUP-001` | تنزيل وفحص واستعادة Backup من واجهة MatePad | P4-REL-002 | V9 FROZEN REFERENCE / DEVICE GATE PENDING | 22/22 UI + 100/100 Core + 15/15 Ink؛ MatePad pending |
| `S5-DATA-005` | هوية تخزين متصفح موحدة ومهاجرة آمنة للأسماء القديمة | P4-REL-003 | CODE VERIFIED / DEVICE GATE PENDING | 100/100 Core + 22/22 Phase 3 + 15/15 Ink + Build |
| `S5-QA-P4-001` | توافق Backup القديم وتشغيل فحوص Phase 4 آلياً قبل Phase 5 | P4-HARD-001 | CODE + PR CI PASS / DEVICE GATE PENDING | Node 22: 100/100 Core + 15/15 Ink + 22/22 P3 + Builds؛ GitHub 3/3 |
| `S5-GIT-001` | `develop` قاعدة التجميع مع فروع قصيرة وPR إلى develop | PRE-P5-FOUNDATION-001 | READY FOR USER REVIEW / PR CI PASS | `develop@2f5196c` + PR #2 + GitHub Actions 3/3 + `BRANCH_AUDIT.md` + `GIT_WORKFLOW_AR.md` |
| `S5-PREVIEW-001` | Preview يبني SHA من GitHub ولا يعتمد Sites | PRE-P5-FOUNDATION-001 | DOCUMENTED / NOT DEPLOYED | `PREVIEW_DEPLOYMENT_AR.md` |
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
