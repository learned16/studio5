# Studio5

Studio5 منصة دراسة ورسم ومشاريع دائمة لخمس سنوات لطالب هندسة تقنيات العمارة
والبناء. يعطي التنفيذ الإنتاجي الأولوية لاحتياجات السنة الأكاديمية الحالية، فوق
Core وعقود ونموذج بيانات قابلة للتوسع من دون إعادة بناء التطبيق أو فقد البيانات.

## السلطة الحالية

1. أحدث قرار صريح ومؤرخ من المستخدم والمسجل في
   [`STUDIO5_AUTHORITY_CURRENT_EN.md`](./docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md).
2. [`Studio5_One_Time_Full_Build_Spec_v5_AR.md`](./docs/authority/Studio5_One_Time_Full_Build_Spec_v5_AR.md)
   لبقية النطاق.
3. الاختبارات والـPull Requests كأدلة لحالة التنفيذ.
4. الوثائق القديمة كتاريخ فقط.

القرار الأحدث يعدل الجزء المتعارض فقط ولا يلغي المواصفة كاملة.

## الحالة الحالية

حالة Phase 4 هي `PARTIAL DEVICE GATE PASS`. نجح PDF Canvas آلياً وعلى Cloudflare
Preview وبصرياً على MatePad، بينما تبقى بوابات Ink داخل Worker وFull
Backup/Verify/Restore والفشل الآمن معلقة. P0 وP3 Functional Prototypes، وWarm
Paper نموذج بصري معتمد كمرجع فقط.

الحالة الدقيقة والمنجز والجاري والقادم موجودة في [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). يجب على أي وكيل برمجي قراءته قبل العمل.

نقطة البداية لأي وكيل جديد هي [`AR_HERE_START.md`](./AR_HERE_START.md)، وإجراء العمل المتكرر موجود في
[`docs/STUDIO5_SOP.md`](./docs/STUDIO5_SOP.md).

## نطاق التنفيذ الحالي

- احتياجات السنة الأكاديمية الحالية هي أولوية الإنتاج.
- السنوات اللاحقة باقية في نطاق المنصة الخمسية، وتُجهز عبر Stable Contracts
  وSubject Profiles وFeature Flags ونقاط امتداد موثقة.
- لا تُبنى تفاصيل وواجهات السنوات اللاحقة قبل حاجتها الأكاديمية.
- Web/PWA هو مسار التنفيذ والإثبات الحالي، وليس قراراً بأن المنتج النهائي Web-only.
- Phase 5 Drawing Coach جزء من Gate D وليست نهاية Studio5، ولم تبدأ بعد.

## البداية الصحيحة للتنفيذ

تم تنفيذ Prototype معزول للقلم والحفظ والاستعادة على HUAWEI MatePad 11.5
PaperMatte، ثم ثُبت سلوكه باختبارات Characterization. الأولوية الحالية هي
`Core + Data contracts + Primary MatePad workflows` ثم التوسع حسب Gates A–G.

المصدر: [`prototype/p0-ink-web/`](./prototype/p0-ink-web/).

راجع [AGENTS.md](./AGENTS.md) قبل أي تعديل، ثم وثائق `docs/`.

## التعاون والمراجعة

- `PROJECT_STATUS.md`: الحقيقة التشغيلية الحالية.
- `docs/tasks/`: نطاق كل دفعة ونتائجها.
- `docs/TRACEABILITY.md`: ربط المتطلبات بالمهام والأدلة.
- `CLAUDE.md`: تعليمات المراجع المستقل.
- `.github/PULL_REQUEST_TEMPLATE.md`: تقرير الدمج والمخاطر والـRollback.
