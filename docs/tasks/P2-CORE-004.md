# P2-CORE-004 - Schedule, Lecture, and Task Domain

## الهدف

إضافة نموذج أسبوعي عام للجدول، ومحاضرات مؤرخة، ومهام قابلة للتصفية داخل Studio5 Core مع حفظ محلي
ومهاجرة Schema من الإصدار 1 إلى 2 من دون فقد البيانات الأكاديمية الحالية.

## Requirement IDs

- `S5-FR-002`
- `S5-DATA-001`
- `S5-DATA-002`

## الملفات المسموحة

- `packages/studio5-core/src/model.mjs`
- `packages/studio5-core/src/schema.mjs`
- `packages/studio5-core/src/store.mjs`
- `packages/studio5-core/src/academic-repository.mjs`
- `packages/studio5-core/src/planning-repository.mjs`
- `packages/studio5-core/tests/core.test.mjs`
- `packages/studio5-core/tests/local-database.test.mjs`
- `packages/studio5-core/tests/planning-repository.test.mjs`
- `packages/studio5-core/scripts/typecheck.mjs`
- `packages/studio5-core/package.json`
- `packages/studio5-core/README.md`
- `PROJECT_STATUS.md`
- `docs/DATA_MODEL.md`
- `docs/TRACEABILITY.md`
- `docs/tasks/P2-CORE-004.md`

## خارج النطاق

- واجهات Today أو Calendar.
- إنشاء محاضرات متكررة تلقائياً؛ الجدول يصف النمط الأسبوعي والمحاضرة تمثل occurrence فعلية.
- PDF وNotebook وFiles.
- Lecture Capture وCloseout.
- إشعارات أو مزامنة.
- AI أو تحليل المهام.

## العقود

- `ScheduleEntry` يرتبط بـ`Subject` عبر Stable ID ويصف يوم ISO أسبوعيًا (الاثنين 1) ووقت بداية ونهاية وفترة سريان اختيارية.
- `Lecture` يرتبط بـ`Subject`، ويمكن أن يرتبط بـ`ScheduleEntry` من المادة نفسها.
- `Task` قد يكون عاماً أو مرتبطاً بمادة أو محاضرة. إذا ارتبط بالاثنين يجب أن تتطابق المادة.
- المهام تملك Status وPriority وموعدًا اختيارياً.
- أوقات المحاضرات ومواعيد المهام تحتاج timezone صريحة لمنع اختلافها بين الأجهزة.
- لا أسماء مواد مثبتة داخل Core.

## معايير القبول

- Schema v2 تضيف `scheduleEntries`, `lectures`, `tasks`.
- Migration من v1 إلى v2 تحفظ السنوات والفصول والمواد كما هي.
- Migration من v0 تستمر بالعمل إلى أحدث إصدار.
- رفض اليوم الأسبوعي أو الوقت أو الـstatus أو الـpriority غير الصالح.
- رفض Subject/Schedule/Lecture IDs المفقودة أو غير المتطابقة.
- إنشاء وقراءة وفلاتر Schedule/Lecture/Task تعمل عبر Stable IDs.
- تحديث حالة المهمة لا يغيّر ID أو `createdAt` ويحدّث `updatedAt`.
- الحفظ وإعادة الفتح يحافظان على البيانات.
- فشل الحفظ لا يبدل ذاكرة Repository ويطلب Recovery قبل كتابة جديدة.
- العمليات المتزامنة لا تفقد سجلات.

## الاختبارات

- Unit لنماذج الوقت والحالات.
- Migration v1 -> v2 وv0 -> v2.
- Relations واختلاف subject بين lecture/schedule/task.
- Repository filters وTask update.
- Persistence reopen وfailure recovery وconcurrent writes.

## Rollback

إعادة فرع المهمة. لا تُعدل Migration v1 لاحقاً؛ إذا رُفع الإصدار واعتمد، يكون الرجوع عبر Restore من نسخة v1
أو Migration لاحقة، لا بإعادة كتابة التاريخ.

## Evidence

- `git diff --check`: ناجح.
- Syntax/Lint (`node --check` لكل ملفات Core): ناجح.
- Module contract/type check: ناجح.
- Unit/Integration tests: `27/27` ناجحة.
- Migration v0 -> v2 وv1 -> v2: ناجحتان مع حفظ بيانات Academic.
- Reopen/Recovery/Concurrent writes: ناجحة.
- Browser IndexedDB smoke: لم يُعد تشغيله في هذه الدفعة؛ لا توجد واجهة، واختبار المتصفح المحلي السابق ما
  يزال مقيدًا ببيئة المتصفح.
- Commit: `c98b162 feat: add schedule lecture and task domain`.
- Push: ناجح على `codex/p2-schedule-lecture-task`.
- الحالة: `DONE` من دون دمج إلى `main`.
