# P4-HARD-001 — Phase 4 Hardening Review

## الحالة

`CODE + CI PASS / PDF-NOTES DEVICE PASS / FULL DEVICE GATE PENDING`

## الهدف

إغلاق المراجعة البرمجية للمرحلة الرابعة قبل بدء Phase 5 عبر:

1. قبول Portable Backup صحيح من Schema قديم بعد فحص سلامة نسخته الأصلية.
2. إبقاء رفض العبث بالـSnapshot والعدادات والمحتوى.
3. تشغيل فحوص المشاريع الثلاثة آلياً على GitHub Actions.
4. تجهيز بوابة MatePad يدوية مستقلة؛ Sites v9 لا يغلق بوابة الجهاز.

## Requirement IDs

- `S5-DATA-004`
- `S5-DATA-005`
- `S5-QA-P4-001`

## الفرع

`codex/p4-hardening-review`

## الملفات المحجوزة

- `packages/studio5-core/src/backup.mjs`
- `packages/studio5-core/tests/backup.test.mjs`
- `.github/workflows/ci.yml`
- `docs/PREVIEW_DEPLOYMENT_AR.md`
- `docs/tasks/P4-HARD-001.md`
- `docs/tasks/P4-MATEPAD-CLOSURE-CHECKLIST.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## معايير القبول

- [x] يُفحص Manifest وSnapshot الأصليان قبل أي Migration.
- [x] يقبل Backup صحيح من Schema 7 ويرحّله إلى Schema 8 مع `notes: []`.
- [x] العبث بالـSnapshot يسبب digest mismatch.
- [x] اختلاف عدادات الكيانات أو مجموعاتها يُرفض.
- [x] المحتوى التالف يُرفض.
- [x] CI يستخدم Node.js 22 ويشغل أوامر `package.json` الموجودة فعلياً.
- [x] لا `continue-on-error` ولا تعطيل للاختبارات.
- [x] تنجح الفحوص المحلية للمشاريع الثلاثة.
- [x] يبقى اختبار MatePad بوابة مستقلة قبل الإغلاق النهائي.

## نتيجة التحقق المحلي

شُغّلت الأوامر فعلياً على Node.js `v22.23.1`:

- Studio5 Core: Lint PASS، Type Check PASS، Tests `100/100`.
- P0 Ink Web: Lint PASS، Type Check PASS، Tests `15/15`، Build PASS.
- P3 Lecture Capture Web: Lint PASS، Type Check PASS، Tests `22/22`،
  Build PASS.
- اختبار Backup المخصص: `8/8`، ويتضمن قبول Schema 7 الصحيح ثم إرجاع Schema 8
  مع `notes: []`.
- Core لا يحتوي أمر `build` في `package.json`، لذلك لم يُدّعَ Build غير موجود.

## مخرجات الويب

- `prototype/p0-ink-web/dist/`
- `prototype/p3-lecture-capture-web/dist/`

التفاصيل والأوامر في `docs/PREVIEW_DEPLOYMENT_AR.md`.

## نتيجة بوابة الجهاز

أفاد المستخدم بتاريخ 2026-07-31 بنجاح PDF/Notes على MatePad: رفع PDF والتنقل
وZoom/Fit width والملاحظات وإعادة التحميل وإغلاق المتصفح وإعادة فتحه وبقاء PDF
والملاحظات بلا تكرار كلها `PASS`. Ink داخل Worker وFull Backup/Verify/Restore
ورفض النسخة التالفة واختبارات التخزين المنخفض والفشل الآمن ما زالت `PENDING`.

> The current P3 and P0 interfaces are functional prototypes and are not the final Studio5 product design.

لا تغلق هذه النتيجة Phase 4 بالكامل، ولا تبدأ Phase 5. الخطوة التالية هي مراجعة
مواصفة Phase 4.5 UI/UX وإكمال بوابات الجهاز المعلقة.

## خارج النطاق

- Phase 5.
- تعديل `main`.
- دمج أي Pull Request.
- إعادة نشر Sites أو استبدال v9.
- تعديل الكود ليتوافق مع Sites.
- تغيير Schema الحالي أو حذف بيانات.

## Rollback / Recovery

لا تتغير صيغة الـBackup ولا Schema الحالي. يمكن الرجوع عن تعديل التحقق والـCI من
هذا الفرع، وتبقى ملفات Backup وبيانات Sites v9 بلا تعديل.
