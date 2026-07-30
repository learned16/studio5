# Implementation Roadmap

## Phase 0 - Foundation (الأسبوع 1)

Ingestion، Decision Ledger، Master Spec، ADRs، هذا المستودع، معايير قبول وخطة مراجعة. لا كود إنتاجي.

## Phase 1 - P0 Ink Prototype (أسبوعان)

قلم، ممحاة، ضغط، Palm rejection، Zoom/Pan، Autosave، crash recovery، reload integrity، export. قرار التقنية بعد القياس.

## Phase 2 - Core (3 أسابيع)

Data model، Subjects، Schedule، Today، Tasks، Files، Notebook basics، قاعدة بيانات محلية.

## Phase 3 - Lecture Flow (3 أسابيع)

PDF/notes بحسب قرار P0، Capture، Closeout، Inbox، Search، Favorites/Recent، offline queue.

## Phase 4 - Reliability (أسبوعان)

Backup/Restore/Export، conflicts، privacy/lock، recovery، observability.

**الحالة:** `PHASE 4 PARTIAL DEVICE GATE PASS — PDF/NOTES PASS; INK AND FULL
BACKUP/RESTORE PENDING`. واجهتا P3 وP0 مرجعان وظيفيان وليستا تصميم المنتج
النهائي، وP0 غير مضاف إلى Worker المنشور.

## Phase 4.5 - UX Foundation

مرحلة تصميم وواجهة فقط باتجاه `Warm Paper Academic Studio`: Product Shell
إنكليزي LTR، ومحتوى المستخدم العربي/المختلط باتجاه تلقائي. التنقل الرئيسي:
`Today / Study / Projects / Practice / Library`. تشمل Unified Workspace
وSettings الثانوية وBackup وResponsive وLight/Dark وDesign Tokens وAccessibility،
وخطة نقل الوظائف الحالية بلا تغيير Core أو Schema أو التخزين.

لا يبدأ الكود قبل مراجعة واعتماد
`docs/PHASE_4_5_UX_FOUNDATION_SPEC_AR.md`.

## Phase 5 - Drawing Coach Lite (أسبوعان)

Exercises، attempts، overlay، قياسات بسيطة، ربط بالتقدم.

## Phase 6 - Hardening (أسبوع)

اختبارات جهاز حقيقي، إصلاحات، seed data، دليل استخدام، Release Candidate.

## Batches

كل Batch يحدد الهدف، النطاق، الملفات المسموحة، ما لا يتغير، الاختبارات، الدليل، وrollback. يبدأ P0 فقط ولا يضيف PDF أو AI ما لم توثق ضرورة تقنية.

الحالة الواقعية وترتيب الدفعات التفصيلي موجودان في `PROJECT_STATUS.md`. قيود مرحلة تاريخية لا تعيد دفعة
مكتملة إلى الخلف. الاختبارات الباقية على MatePad تبقى Gate لاعتماد Ink النهائي، بينما تستمر دفعات Core
المحايدة عن واجهة الرسم.
