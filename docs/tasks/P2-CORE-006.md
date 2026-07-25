# P2-CORE-006 - FileArtifact Intake and Immutable Content

## الهدف

إضافة إدخال ملفات محلي آمن يعتمد SHA-256، يخزن المحتوى بعنوان مشتق من الـHash، يكشف
التكرار قبل إنشاء Metadata جديدة، ويحفظ FileArtifact وFileVersion وFileHash وArtifactLink
من دون تعديل الأصل بصمت.

## Requirement IDs

- `S5-DATA-003`
- `S5-DATA-001`
- `S5-DATA-002`

## الملفات المسموحة

- `packages/studio5-core/src/model.mjs`
- `packages/studio5-core/src/schema.mjs`
- `packages/studio5-core/src/store.mjs`
- `packages/studio5-core/src/academic-repository.mjs`
- `packages/studio5-core/src/file-intake.mjs`
- `packages/studio5-core/src/indexeddb-file-content-store.mjs`
- `packages/studio5-core/tests/core.test.mjs`
- `packages/studio5-core/tests/file-intake.test.mjs`
- `packages/studio5-core/tests/helpers/memory-file-content-store.mjs`
- `packages/studio5-core/scripts/typecheck.mjs`
- `packages/studio5-core/package.json`
- `packages/studio5-core/README.md`
- `PROJECT_STATUS.md`
- `docs/DATA_MODEL.md`
- `docs/TRACEABILITY.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/tasks/P2-CORE-006.md`

## خارج النطاق

- واجهة رفع الملفات.
- PDF viewer أو Preview generation.
- OCR أو AI أو اقتراح المادة.
- مزامنة سحابية أو Google Drive.
- حذف المحتوى أو Garbage collection.
- روابط إلى كيانات لم تُبن بعد مثل Notebook وProject.

## العقود

- SHA-256 يحسب من bytes نفسها، لا من الاسم أو المسار.
- مفتاح التخزين مشتق من الـHash ولا يكشف اسم الملف.
- FileHash وFileVersion وسجل الإدخال Immutable داخل Core.
- رفع bytes مطابقة يعيد `duplicate` ولا ينشئ Artifact ثانية بصمت.
- إضافة Version جديدة متعمدة تزيد `versionNumber` ولا تستبدل القديمة.
- فشل حفظ Metadata لا يحذف content-addressed bytes؛ Journal يبقى مسار الاستعادة.
- الملف الأصلي لا يعدل ولا يعاد ترميزه أثناء Hash أو التخزين.
- ArtifactLink الحالي يدعم Subject وLecture وTask فقط عبر Stable IDs.
- Schema v3 تضاف بمهاجرة v2 -> v3 مختبرة، من دون فقد بيانات v0-v2.

## معايير القبول

1. Hash SHA-256 صحيح وحتمي للـbytes.
2. إدخال ملف جديد ينشئ Artifact وHash وVersion أولى ومحتوى محلياً.
3. إدخال نفس bytes باسم مختلف يكتشف Duplicate ويعيد السجل الموجود.
4. Version جديدة تحفظ السابقة وتستفيد من dedup على مستوى المحتوى.
5. ArtifactLink يرفض الهدف المفقود أو النوع غير المدعوم.
6. Store يرفض استبدال سجلات الملفات Immutable.
7. Reopen وExport/Import يحافظان على Metadata والعلاقات.
8. Migration من v2 إلى v3 تحفظ كل بيانات Academic/Planning/Today.
9. فشل persistence يطلب Recovery ولا يبدل ذاكرة Repository.

## الاختبارات

- SHA-256 ونسخ bytes من دون تعديل الأصل.
- Create/Duplicate/New version.
- Immutable replace guards.
- Stable relations وduplicate link/hash/version guards.
- Schema v0/v1/v2 -> v3.
- Persistence reopen/failure recovery/concurrency.
- File content store contract ببديل Memory.

## Rollback

لا تعاد كتابة Migration v2 بعد رفعها. الرجوع يكون عبر Restore من Snapshot v2 أو Migration
لاحقة. المحتوى المخزن بعنوان Hash لا يُحذف تلقائياً أثناء Rollback لحماية الأصل.
