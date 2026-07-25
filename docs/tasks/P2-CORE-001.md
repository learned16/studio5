# P2-CORE-001 - Core Model and Schema Foundation

## الهدف

إنشاء أول جزء دائم من Studio5 Core: معرفات ثابتة، كيانات أكاديمية عامة، Subject Profiles، Capability Packs، Snapshot versioned، ومهاجرات مختبرة.

## الملفات المسموحة

- `packages/studio5-core/**`
- `PROJECT_STATUS.md`
- `AGENTS.md`
- `README.md`
- `docs/tasks/P2-CORE-001.md`

## خارج النطاق

- أي واجهة مستخدم.
- PDF أو Notebook UI أو AI.
- IndexedDB الفعلي؛ له مهمة مستقلة `P2-CORE-002`.
- أسماء أو بيانات مواد السنة الأولى.
- Schedule وToday وTasks؛ لها Batches لاحقة.
- تعديل P0 Ink Prototype.

## القرارات

- Core مكتبة ECMAScript بلا dependency على Framework حتى يبقى قابلاً لإعادة الاستخدام بعد قرار Stack.
- Subject name بيانات للمستخدم، وليس مفتاحاً أو شرطاً في الكود.
- كل علاقة تربط Stable IDs.
- لا يوجد حذف أو استبدال صامت في هذا Batch.
- Schema تبدأ بالإصدار 1 مع Migration Registry ومسار رفض للإصدارات المستقبلية غير المدعومة.

## معايير القبول

- إنشاء AcademicYear وSemester وSubject دون أسماء مثبتة في الكود.
- Subject يرتبط بـSubjectProfile وCapabilityPack عبر IDs.
- رفض ID مكرر أو علاقة إلى كيان غير موجود.
- Export ثم Import يعيدان البيانات نفسها.
- Migration من snapshot أولي version 0 إلى version 1 مختبرة.
- رفض future schema برسالة مفهومة.
- Lint وType contract وUnit tests ناجحة.

## Rollback

الحزمة معزولة ولا تغير بيانات P0. يمكن عكس commit الخاص بها من فرع Phase 2 من دون Migration أو فقد رسومات.

