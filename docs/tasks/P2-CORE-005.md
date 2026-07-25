# P2-CORE-005 - Today Query Engine

## الهدف

إنشاء محرك قراءة محلي يحول بيانات الجدول والمحاضرات والمهام إلى عرض Today موحد لليوم
المحلي، من دون شبكة ومن دون إضافة واجهة أو تخزين مشتق جديد.

## Requirement IDs

- `S5-FR-003`
- `S5-FR-002`
- `S5-DATA-002`

## الملفات المسموحة

- `packages/studio5-core/src/today-query.mjs`
- `packages/studio5-core/src/academic-repository.mjs`
- `packages/studio5-core/tests/today-query.test.mjs`
- `packages/studio5-core/scripts/typecheck.mjs`
- `packages/studio5-core/package.json`
- `packages/studio5-core/README.md`
- `PROJECT_STATUS.md`
- `docs/DATA_MODEL.md`
- `docs/TRACEABILITY.md`
- `docs/tasks/P2-CORE-005.md`

## خارج النطاق

- واجهة Today.
- إشعارات أو Calendar خارجي.
- اقتراح «شنو تدرس هسه؟» أو AI.
- إنشاء Lecture occurrences أو تعديلها تلقائياً.
- تغيير Schema أو Migration.
- PDF وNotebook وFiles.

## العقود

- اليوم يُحسب بواسطة تاريخ محلي و`utcOffsetMinutes` صريح؛ لا يثبت توقيت بغداد داخل Core.
- حدود اليوم `[startsAt, endsAt)` تمنع تكرار عناصر منتصف الليل.
- Agenda يفضل Lecture الفعلية، ولا يكرر Schedule slot المرتبط بها في اليوم نفسه.
- Schedule slot الفعال بلا Lecture فعلية يظهر كعنصر جدول مشتق فقط، ولا يُحفظ كـLecture.
- المهام `done` و`cancelled` لا تظهر ضمن العمل المفتوح.
- المهام المكتملة خلال اليوم تظهر في قسم مستقل.
- الاستعلام لا يعدل Snapshot أو أي Entity.
- ترتيب النتائج ثابت ويمكن اختباره.

## معايير القبول

1. Agenda تجمع محاضرات اليوم وموعد الجدول غير المغطى بمحاضرة فعلية.
2. تصنف المهام إلى: متأخرة، مستحقة اليوم، بلا موعد، ومكتملة اليوم.
3. تستبعد المهام الملغاة والمكتملة من أقسام العمل المفتوح.
4. تدعم Offset موجباً وسالباً وحدود منتصف الليل.
5. تربط النتائج بسياق المادة عبر Stable IDs من دون تثبيت أسماء مواد.
6. تعمل من Repository محلي بعد إعادة الفتح.
7. لا يتغير Schema v2.

## الاختبارات

- Date window وISO weekday.
- Schedule/Lecture deduplication.
- Task buckets وحالات الحدود.
- ترتيب ثابت.
- Offset يعبر تاريخ UTC.
- عدم تعديل Snapshot.
- Repository reopen.

## Rollback

إعادة Commit المهمة تزيل محرك القراءة فقط. لا توجد Migration أو بيانات جديدة تحتاج Rollback.
