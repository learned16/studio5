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
- Academic Repository بواجهات عامة للسنوات والفصول والمواد وملفات المواد.
- ScheduleEntry أسبوعي عام مرتبط بالمادة.
- Lecture occurrence مؤرخة ويمكن ربطها بموعد أسبوعي.
- Task عامة أو مرتبطة بالمادة والمحاضرة، مع status وpriority وdue date.
- فلاتر Schedule/Lecture/Task وتحديث حالة المهمة عبر نفس Repository المحمي بالـJournal.

الواجهات وToday تأتي في مهام مستقلة.

## التحقق

استخدم Node 22 أو أحدث:

```text
npm run lint
npm run typecheck
npm test
```
