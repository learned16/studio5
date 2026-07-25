# P2-GATE-001 - P0 Ink to Notebook Core Demo

## الهدف

ربط واجهة P0 Ink الحالية بـStudio5 Core محلياً لإثبات أن الرسم يمكن أن يعيش داخل
Notebook مرتبط بسياق أكاديمي، وأن المستخدم يستطيع إنشاء InkRevision صريحة واستعادتها
من IndexedDB من دون تعطيل Autosave/Crash Recovery الحالي.

## Requirement IDs

- `S5-NFR-001`
- `S5-FR-004`
- `S5-DATA-002`

## الملفات المسموحة

- `prototype/p0-ink-web/**`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/tasks/P2-GATE-001.md`

لا يُعدّل `packages/studio5-core/**` في هذه المهمة؛ يُستهلك كما هو.

## داخل النطاق

- تحميل Core modules في نسخة التطوير ونسخة Sites المنشورة من المصدر نفسه.
- إنشاء سياق Demo عام مرة واحدة من خلال Stable IDs، بلا منطق مادة مثبت داخل Core.
- إنشاء Notebook وInkDocument وربطهما بالمادة التجريبية.
- زر صريح لحفظ InkRevision؛ Autosave الحالي يبقى Draft recovery ولا يولد تاريخاً لا نهائياً.
- إظهار حالة Notebook وعدد النسخ وآخر نتيجة حفظ للمستخدم.
- استعادة آخر InkRevision عندما لا توجد مسودة P0 محلية قابلة للاستخدام.
- IndexedDB فعلي لكل من Core metadata وcontent-addressed Ink bytes.
- بقاء القلم والممحاة والتحريك والتصدير والـOffline cache كما كانت.

## خارج النطاق

- شاشة Today أو إدارة المواد الكاملة.
- مزامنة سحابية أو حسابات.
- PDF وLecture Capture وAI.
- تحويل P0 إلى تطبيق السنة الأولى الكامل.
- حذف Revision أو إعادة كتابة تاريخها.

## معايير القبول

1. تفتح واجهة الرسم وتبقى أدوات P0 السابقة قابلة للعمل.
2. ينشأ Notebook/InkDocument مرة واحدة ويعاد استخدامهما بعد إعادة الفتح.
3. زر «حفظ نسخة» ينشئ Revision جديدة فقط عند تغير الرسم.
4. الضغط ثانية من دون تغيير يعرض Duplicate ولا ينشئ Revision إضافية.
5. عدد النسخ الظاهر يطابق Core metadata.
6. عند غياب Draft محلي، يمكن استعادة آخر Revision محمية بالـSHA.
7. Build ينسخ Core modules المطلوبة ولا يعتمد على مسار خارج الحزمة المنشورة.
8. Lint وType Check واختبارات P0 وCore وBuild تنجح.
9. النشر يعيد استخدام `project_id` الموجود ولا ينشئ موقعاً جديداً.

## Rollback

الرجوع يكون بإزالة Bridge وعناصر Notebook UI من P0 مع إبقاء قواعد IndexedDB المحلية من
دون حذف. لا تمسح مسودة المستخدم أو Revisions تلقائياً.

## دليل التنفيذ الحالي

- Commit التنفيذ: `9b806f3`.
- اختبارات Demo: `15/15` ناجحة.
- اختبارات Studio5 Core: `54/54` ناجحة.
- Lint وType Check وBuild: ناجحة.
- فحص خادم التطوير: `index`, `core-runtime`, و`academic-repository` أعادت HTTP 200.
- الفرع مرفوع إلى GitHub من دون دمج `main`.
- نُشر Sites الإصدار `v4` بنجاح على:
  `https://studio5-ink-lab.lharithl.chatgpt.site`.
- الحالة ليست `DONE` بعد: تبقى تجربة MatePad الحقيقية للقلم، Force Kill، حفظ Revision
  مطابقة/مختلفة، وإعادة الفتح.
