# @studio5/core

أول حزمة دائمة في Studio5. تحتوي نموذج البيانات الأكاديمي العام وعقود Schema والمهاجرات، من دون واجهة أو اعتماد على أسماء مواد السنة الأولى.

## الحدود الحالية

- Stable IDs.
- AcademicYear وSemester وSubject.
- SubjectProfile وCapabilityPack.
- Versioned snapshots.
- Migration registry.
- Store محلي في الذاكرة لاختبار العلاقات والتصدير.
- IndexedDB adapter مع Journal وTransaction ذرية وRecovery.

الواجهة والجدول وToday تأتي في مهام مستقلة.

## التحقق

استخدم Node 22 أو أحدث:

```text
npm run lint
npm run typecheck
npm test
```
