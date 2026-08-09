# P4-HARD-001 — Phase 4 Hardening Review

## الحالة

`COMPLETE — AUTOMATED/CI PASS + OWNER-VERIFIED REAL-DEVICE PASS`

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
- [x] أُغلقت بوابة MatePad بدليل المالك المستقل عن Automated/CI.

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
والملاحظات بلا تكرار كلها `PASS`؛ وهذه نتيجة جزئية تاريخية.

أكد المالك بتاريخ 2026-08-09 أن مجموعة اختبارات Phase 4 الكاملة على الجهاز
الحقيقي التي نوقشت سابقاً قد اكتملت ونجحت. التصنيف هو
`OWNER-VERIFIED REAL-DEVICE PASS`، ويشمل Ink وسلوك الجهاز والقلم/Palm Rejection
وInk save/reopen وFull Backup/Verify/Restore ورفض النسخة التالفة
وlow-storage/failure-safe وبقية فحوص المجموعة. لا تسجل هذه الوثيقة Build SHA أو
قياسات أو counts أو تفاصيل سطح تنفيذ لم يقدمها المالك.

تبقى نتائج Automated/CI أعلاه دليلاً مستقلاً، وتبقى نتيجة PDF Canvas في PR #7
`AUTOMATED PASS / CLOUDFLARE PREVIEW PASS / MATEPAD VISUAL PASS` دليلاً منفصلاً.

> The current P3 and P0 interfaces are functional prototypes and are not the final Studio5 product design.

Phase 4 مغلقة، وPhase 4.5 هي التالية. هذا لا يبدأ Phase 5 ولا يجيز live-Ink
Unified Workspace: Batch 3 مؤجل، وتُجدول Batches 3–7 لاحقاً فقط عند حد live-Ink.

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
