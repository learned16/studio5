# P2-CORE-007 - Notebook Basics and Durable Ink Revisions

## الهدف

إضافة أساس Notebook دائم قابل للربط بالمادة والمحاضرة، مع InkDocument مستقل ونسخ Ink
غير قابلة للاستبدال تحفظ محلياً وتستعاد من دون فقد أو تثبيت أسماء مواد السنة الأولى.

## Requirement IDs

- `S5-FR-004`
- `S5-DATA-001`
- `S5-DATA-002`

## الملفات المسموحة

- `packages/studio5-core/src/model.mjs`
- `packages/studio5-core/src/schema.mjs`
- `packages/studio5-core/src/store.mjs`
- `packages/studio5-core/src/academic-repository.mjs`
- `packages/studio5-core/src/ink-format.mjs`
- `packages/studio5-core/tests/core.test.mjs`
- `packages/studio5-core/tests/notebook.test.mjs`
- `packages/studio5-core/scripts/typecheck.mjs`
- `packages/studio5-core/package.json`
- `packages/studio5-core/README.md`
- `PROJECT_STATUS.md`
- `docs/DATA_MODEL.md`
- `docs/TRACEABILITY.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/tasks/P2-CORE-007.md`

## داخل النطاق

- Notebook مرتبط بـSubject، ويمكن ربطه بـLecture من المادة نفسها.
- قوالب: أبيض، مسطر، مربعات، نقاط، isometric، engineering.
- InkDocument مستقل داخل Notebook مع أبعاد وصيغة versioned.
- InkRevision غير قابلة للاستبدال؛ كل حفظ متعمد ينشئ revision جديدة.
- محتوى Ink JSON يُنسخ ويُطبع بصيغة حتمية ثم يخزن بعنوان SHA-256.
- كشف حفظ المحتوى نفسه مجدداً وعدم إنشاء revision مكررة.
- التحقق من Hash والحجم عند الاسترجاع.
- Schema v4 وMigration من v3 من دون فقد بيانات السنوات والمواد والمهام والملفات.
- Reopen وRecovery عند فشل حفظ Metadata.

## خارج النطاق

- واجهة Notebook أو أدوات الرسم.
- PDF أو الكتابة فوق PDF.
- Layers UI أو Undo/Redo أو الممحاة؛ تبقى في محرك Ink/الواجهة.
- Lecture Capture وCloseout.
- AI أو OCR أو مزامنة متعددة الأجهزة.
- تعديل أو حذف revision قديمة.

## معايير القبول

1. لا يمكن إنشاء Notebook لمادة مفقودة أو لمحاضرة من مادة مختلفة.
2. يدعم Notebook القوالب المعتمدة كبيانات عامة، لا كصفحات hardcoded.
3. InkDocument يرتبط بـNotebook عبر Stable ID ويحمل format version صريحاً.
4. حفظ Ink ينسخ المدخل ولا يعدله، ويحافظ على ترتيب Layers/Strokes/Points.
5. كل revision جديدة تحفظ القديمة، والمحتوى المطابق يعاد كـDuplicate.
6. استرجاع revision يرفض أي تلف بالحجم أو SHA-256.
7. Reopen يعيد Notebook وInkDocument وRevisions والمحتوى.
8. فشل Metadata commit يبقي المحتوى ويطلب Recovery عبر Journal.
9. Migration v3 -> v4 تضيف Collections الجديدة وتحفظ كل بيانات v0-v3.

## Rollback

لا تعاد كتابة Migration v3 بعد رفعها. الرجوع يكون عبر Snapshot/Export سابق أو Migration
لاحقة. محتوى Ink المعنون بالـHash لا يُحذف تلقائياً أثناء الرجوع لحماية رسومات المستخدم.

## دليل التنفيذ

- النتيجة: `DONE`.
- Commit التنفيذ: `93a254c`.
- فحص الصياغة والعقود: ناجح.
- الاختبارات: `54/54` ناجحة.
- الأدلة تشمل: علاقات المادة والمحاضرة، القوالب العامة، عدم تعديل مدخل Ink، ترتيب
  Layers/Strokes/Points، Revisions متزامنة، Duplicate، Reopen، كشف التلف بالحجم والـSHA،
  Recovery بعد فشل الحفظ، وMigration من v0/v1/v2/v3 إلى v4.
- لم تُبن واجهة Notebook في هذه المهمة، ولم يُدّعَ نجاح MatePad أو IndexedDB browser
  integration من اختبارات Node؛ هذا جزء من Demo/Gate الجهاز التالي.
