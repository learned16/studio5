# Studio5

Studio5 هو نظام دراسة ورسم شخصي لطالب هندسة تقنيات العمارة والبناء. تبنى النسخة الحالية للسنة الأولى فقط، فوق Core دائم يتيح إضافة السنوات اللاحقة عبر بيانات وModules ومهاجرات، لا عبر إعادة بناء التطبيق.

المرجع السلطوي: [`Studio5_Year_One_Work_Handoff_AR-1(1).pdf`](./Studio5_Year_One_Work_Handoff_AR-1(1).pdf).

## الحالة الحالية

اكتملت وثائق **Project Foundation**، ونُشرت نسخة P0 Candidate A لاختبار القلم والحفظ والاستعادة. بدأت Phase 2 ببناء Studio5 Core المحايد عن أسماء المواد والتقنية النهائية.

الحالة الدقيقة والمنجز والجاري والقادم موجودة في [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). يجب على أي وكيل برمجي قراءته قبل العمل.

نقطة البداية لأي وكيل جديد هي [`AR_HERE_START.md`](./AR_HERE_START.md)، وإجراء العمل المتكرر موجود في
[`docs/STUDIO5_SOP.md`](./docs/STUDIO5_SOP.md).

## حدود النسخة الحالية

- سنة أولى فقط، لمستخدم واحد.
- الدراسة، الملفات، PDF/Notebook/Ink، المهام، Today، النسخ الاحتياطي والتصدير، وDrawing Coach Lite.
- لا سنوات 2-5، ولا AI Council، ولا Desktop Companion أو تكاملات CAD/BIM أو مزامنة متعددة الأجهزة معقدة.

## البداية الصحيحة للتنفيذ

تم تنفيذ أول Prototype معزول للقلم والحفظ والاستعادة على HUAWEI MatePad 11.5 PaperMatte. المرحلة الحالية تبدأ بالـCore: نموذج البيانات العام، المعرفات الثابتة، العقود، والمهاجرات قبل الشاشات.

المصدر: [`prototype/p0-ink-web/`](./prototype/p0-ink-web/).

راجع [AGENTS.md](./AGENTS.md) قبل أي تعديل، ثم وثائق `docs/`.

## التعاون والمراجعة

- `PROJECT_STATUS.md`: الحقيقة التشغيلية الحالية.
- `docs/tasks/`: نطاق كل دفعة ونتائجها.
- `docs/TRACEABILITY.md`: ربط المتطلبات بالمهام والأدلة.
- `CLAUDE.md`: تعليمات المراجع المستقل.
- `.github/PULL_REQUEST_TEMPLATE.md`: تقرير الدمج والمخاطر والـRollback.
