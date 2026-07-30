# P4.5-UX-SPEC-001 — Phase 4.5 UX Foundation Specification

## الحالة

`DOCUMENTATION ONLY / READY FOR USER REVIEW`

## الهدف

توثيق نجاح بوابة Phase 4 الوظيفية على جهاز
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

1. واجهة P3 الحالية إثبات وظيفي، وليست تصميم المنتج النهائي.
2. Phase 4.5 مرحلة UI/UX فقط، وتستهلك عقود Core والوظائف الحالية من دون تغيير
   معناها أو صيغة بياناتها.
3. أي تطبيق لاحق للمواصفة يجب أن يحافظ على Stable IDs وIndexedDB والملفات
   وNotes وInk وBackup الحالية.
4. نقطة دخول Drawing Coach لا تعني تنفيذ Phase 5.

## معايير القبول

- [x] تسجيل نتيجة Device Gate كما أفاد بها المستخدم، من دون اختلاق قياسات إضافية.
- [x] توضيح أن واجهة P3 الحالية Functional Validation Prototype فقط.
- [x] كتابة مواصفة Phase 4.5 لكل الشاشات والمحاور المطلوبة.
- [x] توثيق معايير MatePad والقلم والاستجابة والثيمات والإتاحة.
- [x] توثيق نقل الوظائف الحالية بلا إعادة كتابة Core.
- [x] اقتراح Tag `v0.4-phase-4-functional-stable` من دون إنشائه.
- [x] عدم تعديل كود التطبيق أو البيانات أو إعداد النشر.

## التحقق

- مراجعة `git diff --check`.
- التأكد أن جميع الملفات المتغيرة Markdown فقط.
- التأكد أن `git diff --name-only` لا يحتوي `packages/**` أو `prototype/**`.
- لا تُشغّل اختبارات التطبيق لأن الكود والاعتماديات لم تتغير؛ تبقى نتائج CI
  والـDevice Gate السابقة هي الدليل الوظيفي.

## Rollback / Recovery

التراجع عن هذا الفرع يعيد الوثائق فقط. لا يوجد Schema migration ولا تغيير في
بيانات المستخدم أو ملفات PDF أو Notes أو Ink أو Backup.
