# P2-CORE-003 - Academic Repository APIs

## الهدف

تقديم واجهات عامة وآمنة لإنشاء واسترجاع AcademicYear وSemester وSubject وSubjectProfile وCapabilityPack، فوق CoreStore وCoreLocalDatabase، من دون كشف تفاصيل التخزين للشاشات المستقبلية.

## الملفات المسموحة

- `packages/studio5-core/**`
- `PROJECT_STATUS.md`
- `docs/tasks/P2-CORE-003.md`

## خارج النطاق

- أي شاشة أو بيانات مواد ثابتة.
- تعديل وحذف الكيانات؛ تُحدد سياساتها في Batch لاحق.
- Schedule وLecture وTask وToday.
- PDF وNotebook وAI.
- مزامنة أو API سحابي.

## قواعد السلوك

1. كل Create يبني الكيان بواسطة Model factory ثم يحفظ Snapshot.
2. Mutation تعمل Copy-on-write؛ لا تتغير حالة Repository إذا فشل الحفظ.
3. العمليات المتزامنة تُنفذ بالتسلسل لمنع Lost Update.
4. بعد فشل Persistence تُحظر الكتابة حتى `recover()` حتى لا يُستبدل Journal غير المثبت.
5. الفلاتر تستخدم Stable IDs فقط.
6. أسماء المواد بيانات حرة ولا تدخل في شروط Core.

## معايير القبول

- إنشاء سنة وفصل وCapabilityPack وSubjectProfile ومادة عبر Repository.
- إعادة فتح Repository من نفس Driver تعيد البيانات نفسها.
- فلترة الفصول حسب السنة والمواد حسب الفصل أو السنة.
- رفض العلاقات المفقودة.
- عمليتا Create متزامنتان لا تفقدان إحداهما.
- فشل الحفظ لا يغير الذاكرة ويحظر كتابة جديدة.
- `recover()` يستعيد العملية المعلقة ثم يسمح باستمرار العمل.
- Lint وType contract وUnit tests ناجحة.

## Rollback

الـRepository طبقة جديدة فوق العقود الحالية. عكس Commit يزيلها دون تغيير Schema أو حذف بيانات IndexedDB.

## Evidence

- Syntax/Lint: PASS.
- Module contract: PASS.
- إجمالي اختبارات Core: 19/19 PASS.
- Persist ثم Reopen: PASS.
- Filters بواسطة Stable IDs: PASS.
- Missing relations: PASS.
- Concurrent creates دون Lost Update: PASS.
- Persistence failure ثم Recovery: PASS.
