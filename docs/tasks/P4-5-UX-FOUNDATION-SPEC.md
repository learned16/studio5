# P4.5-UX-SPEC-001 — Phase 4.5 UX Foundation Specification

## الحالة

`DOCUMENTATION COMPLETE / INCREMENTAL IMPLEMENTATION AUTHORIZED BY OWNER`

## الهدف

توثيق نجاح بوابة PDF/Notes الجزئية من Phase 4 على جهاز
`HUAWEI MatePad 11.5 PaperMatte`، ثم تحديد أساس تجربة الاستخدام والواجهة الموحدة
لـStudio5 قبل كتابة أي كود جديد.

## Requirement IDs

- `S5-QA-P4-001`
- `S5-UX-FOUNDATION-001`

## الفرع

`codex/p4-device-pass-ux-foundation-spec`

## الملفات المسموح تعديلها

- `PROJECT_STATUS.md`
- `AR_HERE_START.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/TRACEABILITY.md`
- `docs/DECISION_LOG.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/PREVIEW_DEPLOYMENT_AR.md`
- `docs/PHASE_4_5_UX_FOUNDATION_SPEC_AR.md`
- `docs/tasks/P4-MATEPAD-CLOSURE-CHECKLIST.md`
- `docs/tasks/P4-HARD-001.md`
- `docs/tasks/P4-REL-002.md`
- `docs/tasks/P4-REL-003.md`
- `docs/tasks/P3-LF-008.md`
- `docs/tasks/P3-LF-009.md`
- `docs/tasks/P3-LF-010.md`
- `docs/tasks/P4-WORKERS-STATIC-PREVIEW.md`
- `docs/tasks/P4-5-UX-FOUNDATION-SPEC.md`

## خارج النطاق

- أي تعديل في `packages/**` أو `prototype/**`.
- إعادة كتابة واجهة P3 الحالية أو حذفها.
- تغيير Core أو Schema أو Storage أو Backup.
- تنفيذ Phase 4.5 أو Phase 5.
- إنشاء Tag أو دمج Pull Request.
- إعادة نشر التطبيق.

## القيود المعمارية

1. واجهتا P3 وP0 الحاليتان إثباتان وظيفيان، وليستا تصميم المنتج النهائي. P0
   مستقل وغير مضاف إلى Worker المنشور.
2. Phase 4.5 مرحلة UI/UX فقط، وتستهلك عقود Core والوظائف الحالية من دون تغيير
   معناها أو صيغة بياناتها.
3. أي تطبيق لاحق للمواصفة يجب أن يحافظ على Stable IDs وIndexedDB والملفات
   وNotes وInk وBackup الحالية.
4. نقطة دخول Drawing Coach داخل Practice لا تعني تنفيذ Phase 5.
5. Product Shell إنكليزي LTR، مع اتجاه تلقائي لمحتوى المستخدم العربي والمختلط.
6. التنقل الرئيسي `Today / Study / Projects / Practice / Library`.

## معايير القبول

- [x] تسجيل نتيجة PDF/Notes الجزئية كما أفاد بها المستخدم، مع إبقاء Ink وFull Backup/Restore معلّقين.
- [x] توضيح أن واجهتي P3 وP0 Functional Prototypes فقط.
- [x] كتابة مواصفة Phase 4.5 لكل الشاشات والمحاور المطلوبة.
- [x] توثيق معايير MatePad والقلم والاستجابة والثيمات والإتاحة.
- [x] توثيق نقل الوظائف الحالية بلا إعادة كتابة Core.
- [x] منع اقتراح أو إنشاء Stable Tag قبل إغلاق Phase 4 بالكامل.
- [x] عدم تعديل كود التطبيق أو البيانات أو إعداد النشر.
- [x] اعتمد المالك بتاريخ 2026-08-09 بدء Phase 4.5 على دفعات صغيرة مستقلة.
- [x] تحولت التفاصيل البصرية المفتوحة إلى فرضيات تُراجع لكل شريحة، لا Blocker
  لبداية App Shell والتنقل.
- [x] حُددت `P4.5-UX-IMPLEMENTATION-001` كأول مهمة مؤهلة، من دون Core أو Ink أو
  Worker cutover أو Phase 5.

## نتيجة المصالحة اللاحقة

Warm Paper Academic Studio يبقى مرجعاً بصرياً معتمداً فقط، لا المنتج النهائي.
يمكن بدء App Shell والتنقل في سطح معزول، ثم تمر كل شريحة ببوابة الاختبار
والمراجعة والقرار البشري الخاصة بها. لا يبدأ Unified Workspace Ink الحي قبل
سلسلة Ink Batches 3–7؛ ولا يُختار Batch 3 تلقائياً قبل شرائح Phase 4.5 التي لا
تعتمد عليه.

## التحقق

- مراجعة `git diff --check`.
- التأكد أن جميع الملفات المتغيرة Markdown فقط.
- التأكد أن `git diff --name-only` لا يحتوي `packages/**` أو `prototype/**`.
- لا تُشغّل اختبارات التطبيق لأن الكود والاعتماديات لم تتغير؛ تبقى نتائج CI
  وبوابة PDF/Notes السابقة هي الدليل الوظيفي المحدود لها فقط.

## Rollback / Recovery

التراجع عن هذا الفرع يعيد الوثائق فقط. لا يوجد Schema migration ولا تغيير في
بيانات المستخدم أو ملفات PDF أو Notes أو Ink أو Backup.
