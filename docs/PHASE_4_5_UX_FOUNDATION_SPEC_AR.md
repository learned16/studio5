# Studio5 Phase 4.5 — UX Foundation Specification

## 1. الغرض والحالة

Phase 4.5 مرحلة تصميم وتجربة استخدام وتنفيذ واجهة تدريجية، تقع بين إثبات الوظائف
في Phase 4 وتنفيذ Drawing Coach في Phase 5. هدفها تحويل القدرات الحالية إلى بنية واجهة
موحدة ومناسبة للاستخدام الجامعي اليومي، من دون تغيير Core أو Schema أو التخزين
أو Backup.

حالة Phase 4 الحالية:
`PARTIAL DEVICE GATE PASS — CURRENT OWNER DEVICE-TEST SESSION COMPLETE; CUTOVER GATES CARRIED FORWARD`.

> The current P3 and P0 interfaces are functional prototypes and are not the final Studio5 product design.

اعتمد المالك بتاريخ 2026-08-09 بدء Phase 4.5 على دفعات صغيرة مستقلة. تبدأ
الدفعة الأولى بـApp Shell والتنقل فقط وفق
`docs/tasks/P4-5-UX-IMPLEMENTATION-001.md`. تبقى التفاصيل البصرية غير المثبتة
فرضيات تُراجع شريحة بعد أخرى، وليست مانعاً لبدء هذا الأساس المحدود. لا تمنح هذه
الموافقة إذناً بتغيير Core أو البيانات أو دمج Ink أو بدء Phase 5.

## 2. مبادئ المنتج

1. **الخطوة التالية واضحة:** كل شاشة تساعد المستخدم على معرفة ما ينبغي فعله الآن.
2. **المحتوى قبل الزينة:** المادة والمحاضرة والمهمة والملف والمشروع هي المركز.
3. **Local-first ظاهر ومفهوم:** الحفظ المحلي وحالة Backup يظهران بلا مصطلحات تقنية.
4. **قلم أولاً على MatePad:** الأهداف اللمسية والمساحات والأدوات تراعي اليد والقلم.
5. **اتجاه المنتج ثابت:** Product Shell باللغة الإنكليزية، والتطبيق LTR.
6. **المحتوى متعدد الاتجاهات:** أسماء الملفات والملاحظات ومحتوى المستخدم العربي
   والمختلط تستخدم كشف اتجاه تلقائياً، من دون تحويل App Shell كله إلى RTL.
7. **Progressive disclosure:** تظهر الإجراءات الأساسية أولاً، والتفاصيل عند الطلب.
8. **قابلية الاستبدال:** الواجهة الجديدة تستهلك عقود Core الحالية ولا تملك منطق
   المجال أو مخطط البيانات.
9. **لا ادعاء كاذب:** لا تعرض الواجهة نجاح حفظ أو Backup أو AI قبل تأكيد النتيجة.

الاتجاه البصري المعتمد هو `Warm Paper Academic Studio`: سطح أكاديمي دافئ وهادئ
يعطي أولوية للقراءة والرسم والعمل طويل المدة، مع Light/Dark themes مبنيين من
Design Tokens مشتركة.

## 3. نطاق Phase 4.5

### داخل النطاق

- بنية المعلومات والتنقل الموحد.
- App Shell وDesign System.
- `Today / Study / Projects / Practice / Library`.
- PDF/Notes/Ink Workspace.
- Settings كوجهة ثانوية وBackup/Restore/Export.
- Subjects داخل Study.
- نقطة دخول Drawing Coach داخل Practice فقط.
- Responsive layout وLight/Dark themes والإتاحة.
- خطة نقل وظائف P3 الحالية إلى الواجهة الجديدة.

### خارج النطاق

- تمارين Drawing Coach ومحرك تقييم الرسم.
- Understanding Rescue أو أي AI جديد.
- تغيير Core أو Schema أو IndexedDB أو Storage Profile.
- تغيير صيغة Backup أو Migration.
- مزامنة متعددة الأجهزة.
- إعادة كتابة وظائف P3 التي ثبتت وظيفياً.
- حذف واجهات P3 الحالية قبل اكتمال التحقق من البديل.

## 4. بنية المعلومات

### المستوى الأول

1. **Today**
2. **Study**
3. **Projects**
4. **Practice**
5. **Library**

Subjects تكون داخل `Study`. Drawing Coach يكون داخل `Practice`. Tasks ليست
وجهة رئيسية منفصلة؛ تظهر في `Today` وداخل المادة أو المشروع المناسب. Search
إجراء عام متاح من الـApp Shell، وSettings وجهة ثانوية. عند فتح PDF أو Note أو
Drawing ينتقل المستخدم إلى Unified Workspace مع الحفاظ على سياق الرجوع.

### قواعد الربط

- كل Lecture وTask وFile وNote وInk يرتبط بسياق أكاديمي عبر Stable ID.
- لا تعتمد الشاشة على اسم مادة ثابت؛ تستخدم `SubjectProfile` و`CapabilityPack`.
- فتح ملف من Today أو Study أو Project أو Library يقود إلى Workspace نفسه مع حفظ سياق الرجوع.
- لا تُحذف `Projects` من التنقل الرئيسي حتى إن كان محتواها في البداية محدوداً.
- الروابط العميقة تحفظ المسار المنطقي، لا حالة UI مؤقتة غير قابلة للاستعادة.

## 5. التنقل الرئيسي

### MatePad Landscape

- Navigation Rail ثابت في اليسار بما يطابق اتجاه LTR.
- الأيقونة مع تسمية إنكليزية واضحة؛ لا تعتمد الأيقونة وحدها.
- زر إجراء سريع واحد فقط في موضع ثابت، يتغير حسب السياق.
- Settings في أسفل الـRail كوجهة ثانوية لتجنب مزاحمة الدراسة اليومية.

### MatePad Portrait والهواتف

- Bottom Navigation لخمس وجهات أساسية.
- Settings داخل قائمة الحساب/المزيد.
- لا يزيد عدد الوجهات الظاهرة عن خمس.

### الشاشات الواسعة

- Rail قابل للتوسيع إلى Sidebar.
- حد أقصى لعرض المحتوى؛ لا تتمدد الفقرات والقوائم على الشاشة كلها.
- Panels ثانوية قابلة للإخفاء من دون فقد موقع القراءة أو المسودة.

### سلوك الرجوع

- Back يعيد المستخدم إلى السياق السابق ويحافظ على الفلتر والصفحة والـscroll.
- إغلاق Workspace لا يحذف Draft.
- عند وجود تعديل غير محفوظ تظهر حالة Autosave الحقيقية، لا نافذة تحذير وهمية.

## 6. Today

Today هي الشاشة الافتراضية وتجيب: «شنو أشتغل هسه؟».

### المحتوى

- التاريخ، حالة اليوم، وآخر مزامنة/Backup محلية عند الحاجة.
- Next Best Action مبني على البيانات الحالية فقط.
- محاضرات اليوم.
- مهام مستحقة ومتأخرة.
- Captures غير المنظمة.
- آخر ملف أو Workspace مستخدم.
- تقدم قصير قابل للتنفيذ، لا لوحة إحصاءات ضخمة.

### الأولويات

الترتيب يستخدم الموعد والحالة والسياق الأكاديمي الموجود في Core. لا تُضاف خوارزمية
درجات أو AI داخل Phase 4.5.

### حالات الشاشة

- يوم فارغ مع اقتراح إضافة مادة أو مهمة.
- بيانات جزئية.
- Offline.
- خطأ قراءة محلي قابل للاستعادة.
- كثافة عالية مع تجميع حسب «الآن، اليوم، لاحقاً».

## 7. Study (Subjects)

### صفحة القائمة

- السنة والفصل كمرشح سياقي.
- بطاقات مواد تعرض الاسم، الملف الشخصي، أقرب موعد، وعدد العناصر المفتوحة.
- بحث وفلترة من دون تثبيت أسماء المواد في الواجهة.

### صفحة المادة

- Overview.
- Lectures.
- Files & Notes.
- Tasks.
- Assessments/Grades entry عندما تتوفر القدرة.
- Projects entry عندما تتوفر القدرة.
- الأدوات الإضافية تأتي من Capability Packs.

### حالة المادة

- Empty state يشرح الإجراء الأول.
- لا تُحسب نسبة إتقان من مشاهدة ملف فقط.
- لا تخفي المادة القديمة؛ تُؤرشف مع بقاء روابطها وبياناتها.

## 8. Projects

`Projects` وجهة رئيسية معتمدة وليست امتداداً اختيارياً للمادة. في Phase 4.5
يُعرّف تدفق الواجهة فقط، ويستخدم بيانات المشاريع الحالية عند توفرها من Core:

- قائمة المشاريع مع الحالة والموعد والسياق الأكاديمي.
- فتح المشروع يعرض المهام والملفات والملاحظات وملاحظات الدكتور المرتبطة.
- Tasks الخاصة بالمشروع تظهر هنا وفي Today، من دون إنشاء نسخ مكررة.
- فتح ملف أو رسم من المشروع يقود إلى Unified Workspace.
- Empty state يوضح أن إنشاء المشروع لا يتطلب اختيار مادة ثابتة داخل Core.
- لا تنفذ Phase 4.5 محرك مشاريع جديداً ولا تغير Schema.

## 9. Library

### الوظائف

- PDF والملفات والملاحظات والـInk المرتبط.
- بحث موحد، Recent، Favorites، وفرز حسب المادة والتاريخ والنوع.
- List/Grid قابلان للتبديل.
- إدخال ملف بزر نظام أصلي واضح ومتوافق مع MatePad.
- إظهار حالة الملف المحلي وحجمه ومصدره من دون تعديل الأصل.

### بطاقات الملفات

- اسم واضح قابل للالتفاف.
- نوع الملف، المادة، آخر فتح، وعدد Notes.
- إجراءات سريعة محدودة: فتح، مفضلة، المزيد.
- الحذف ليس إجراءً سريعاً، ويحتاج تأكيداً وسياسة Recovery لاحقاً.

### الحالات

- مكتبة فارغة.
- ملف مفقود أو Content Store غير متاح.
- PDF كبير أثناء التحميل المحلي.
- نتيجة بحث فارغة.
- تعارض أو مهاجرة متوقفة مع رسالة تحافظ على البيانات.

## 10. PDF / Notes / Ink Unified Workspace

Workspace هو السطح المركزي للدراسة، وليس قارئ PDF منفصلاً.

### MatePad Landscape

- **الوسط:** PDF أو Canvas.
- **اليمين:** Panel سياقي للملاحظات، الفهرس، الصفحات، والبحث.
- **الأعلى:** شريط مستند مضغوط للاسم والحفظ والرجوع.
- **الأسفل أو Floating Toolbar:** أدوات القلم عند تفعيل Ink.

### Portrait

- المستند يملأ العرض.
- الأدوات الثانوية في Bottom Sheet.
- قائمة الصفحات والملاحظات تفتح كPanel مؤقت يحفظ حالة المستند.

### قواعد PDF

- تنقل الصفحات وZoom وFit width إجراءات دائمة الوصول.
- موقع الصفحة والZoom يحفظان كحالة عرض، لا كتغيير في PDF.
- PDF الأصلي immutable.
- فشل العارض لا يمحو الملف، ويعرض مسار فتح أو إعادة محاولة آمن.

### قواعد Notes

- Note مرتبطة بالملف والصفحة عند توفرهما.
- Draft يحفظ تلقائياً ويستعاد بعد Reload أو إغلاق المتصفح.
- قائمة Notes تسمح بالانتقال إلى الصفحة المرتبطة.
- إنشاء Note لا يغير bytes الملف.

### قواعد Ink

- P0 Ink هو Functional Prototype مستقل وغير مضاف حالياً إلى Worker المنشور.
- لا يعاد استخدام تصميم P0 القديم في المنتج.
- تُحفظ قدرات المحرك المثبتة: القلم، الضغط، Palm Rejection، الممحاة المقطعية،
  Autosave، Recovery، والاختبارات.
- واجهة Ink الجديدة ستُبنى لاحقاً داخل Unified Workspace؛ لا تكتب أو تفصل Ink
  Engine داخل هذا PR التوثيقي.
- القلم يرسم، واللمس لا يحرك اللوحة أثناء الرسم.
- Pan لا يعمل إلا عند اختيار أداة التحريك أو عبر Gesture موثق.
- الضغط وPalm rejection والممحاة المقطعية يحافظ عليها المحرك الحالي.
- Ink طبقة مستقلة قابلة للإخفاء والتصدير والاستعادة.
- Autosave وRecovery يسبقان أي تحسين بصري.

Ink Batch 3 ليس شرطاً لشرائح App Shell والتنقل أو Today/Study للقراءة فقط أو
Library/PDF/Notes adapters. قبل شريحة live-Ink Unified Workspace يلزم إكمال
سلسلة الاستخراج Batches 3–7 والتحقق منها؛ Batch 3 وحده غير كافٍ. يُجدول هذا
العمل لاحقاً عند ذلك الحد ولا يبدأ تلقائياً من هذه المواصفة.

## 11. Tasks (Contextual)

### الظهور

- Tasks تظهر في Today وداخل Study/Subject أو Project المرتبط.
- يمكن فتح عرض شامل من Search أو إجراء ثانوي، لكنه ليس وجهة رئيسية سادسة.

- Today، Upcoming، Overdue، Completed.
- فلترة حسب Subject ونوع المهمة.
- الإضافة السريعة تحتاج عنواناً وموعداً اختيارياً وسياقاً اختيارياً.
- التفاصيل المتقدمة تظهر بعد إنشاء المهمة.

### صفحة المهمة

- العنوان والحالة والموعد.
- الارتباط بالمادة والمحاضرة أو المشروع.
- ملفات وملاحظات مرتبطة.
- سجل زمني مختصر للحالة عند توفره في Core.

### قواعد السلامة

- لا تُحذف المهمة المكتملة تلقائياً.
- فشل الحفظ يعرض النتيجة الحقيقية ويبقي الإدخال قابلاً للاستعادة.

## 12. Practice / Drawing Coach Entry Point

Phase 4.5 تنشئ وجهة `Practice` في التنقل، وتضع داخلها نقطة دخول Drawing Coach فقط:

- بطاقة تعريف بالهدف.
- حالة `Coming after UX approval` أو Feature Flag مغلق.
- رابط إلى خريطة المهارات المستقبلية عند اعتماد Phase 5.
- لا تمارين، لا Rubrics، لا تقييم رسم، ولا Schema جديد.

هذه النقطة تمنع إعادة تصميم التنقل عند بدء Phase 5 من دون أن تبدأ تنفيذها مبكراً.

## 13. Settings وBackup

### أقسام Settings

- المظهر: Light/Dark/System.
- لغة Product Shell واتجاه LTR ثابتان لهذه النسخة؛ إعدادات عرض محتوى المستخدم
  تحترم الكشف التلقائي للاتجاه.
- سلوك القلم والـWorkspace ضمن الخيارات المدعومة فعلياً.
- التخزين المحلي وحالته.
- Backup/Restore/Export.
- About ونسخة التطبيق وSchema المعروضة للقراءة فقط.

### Backup

- ملخص واضح لما سيُحفظ.
- زر Create Backup مع حالة تقدم ونجاح/فشل حقيقية.
- Verify قبل Restore.
- ملخص Manifest مفهوم قبل التأكيد.
- تأكيد صريح قبل الاستعادة.
- إلغاء Restore لا يغير البيانات.
- بعد النجاح يظهر الإجراء المطلوب، مثل Reload، بوضوح.

لا تغيّر Phase 4.5 صيغة الـBackup أو محرك التحقق أو Migration.

## 14. تصميم MatePad والقلم

- المقاس المرجعي: `HUAWEI MatePad 11.5 PaperMatte`.
- Landscape هو وضع العمل الثقيل، وPortrait مدعوم للتصفح السريع.
- Touch target أدنى `48×48dp` للإجراءات الأساسية.
- مسافة كافية بين أدوات القلم والإجراءات التخريبية.
- لا Hover كشرط لفهم وظيفة.
- دعم لوحة المفاتيح عند وجودها من دون تعطيل اللمس.
- Full-screen Workspace اختياري.
- Toolbars لا تغطي منطقة الرسم أو حافة راحة اليد.
- استجابة فورية للمؤشر، وحالة الحفظ لا تعطل الرسم.

## 15. Responsive Layout

| النطاق | السلوك |
|---|---|
| أقل من 600px | عمود واحد وBottom Navigation وBottom Sheets |
| 600–1023px | Tablet portrait؛ عمود رئيسي وPanel مؤقت |
| 1024–1439px | MatePad landscape؛ Rail وWorkspace ثنائي/ثلاثي المناطق |
| 1440px فأكثر | Sidebar موسع وحد أقصى للمحتوى وPanels ثابتة اختيارياً |

الـbreakpoints مرجع أولي ويُثبت بالاختبار البصري، لا بأسماء الأجهزة فقط.

## 16. Light وDark Themes

- الوضع الافتراضي يتبع النظام.
- Light مناسب للقراءة الطويلة والـPDF.
- Dark يقلل الوهج ولا يعكس ألوان المستند الأصلي.
- Canvas/PDF يحتفظ بخلفيته الأصلية ما لم يطلب المستخدم معالجة عرض منفصلة.
- حالة التركيز والخطأ والنجاح لا تعتمد على اللون وحده.
- تغيير الثيم لا يعيد تحميل المستند ولا يفقد Draft أو موقع الصفحة.

## 17. Design Tokens

### الألوان الدلالية

- `color.bg.canvas`
- `color.bg.surface`
- `color.bg.elevated`
- `color.text.primary`
- `color.text.secondary`
- `color.border.default`
- `color.action.primary`
- `color.state.info|success|warning|danger`
- `color.ink.default`

لا تستخدم أسماء ألوان مثل `blue500` في Contracts الواجهة العامة؛ القيم الفعلية
تُربط بالثيم.

### القياسات

- Spacing scale: `4, 8, 12, 16, 24, 32, 48`.
- Radius: `8, 12, 16`.
- Touch: `48` أدنى، و`56` للإجراء الرئيسي.
- Content widths: قراءة `720px` تقريباً، وWorkspace مرن.

### Typography

- `display`, `title`, `body`, `label`, `caption`.
- خط Product Shell واضح للإنكليزية، مع fallback عربي واضح يدعم الأرقام والرموز الهندسية.
- Body لا يقل عن `16px` في المحتوى الدراسي.
- Line height مريح للنص الإنكليزي والعربي.

### الحركة والطبقات

- Motion سريع ومحدود، مع `prefers-reduced-motion`.
- Z-index tokens محددة للـRail وToolbar وSheet وDialog وToast.
- لا animation تعطل القلم أو Autosave.

## 18. المكونات المشتركة

- `AppShell`
- `NavigationRail` / `BottomNavigation`
- `TopBar`
- `ContextHeader`
- `ActionButton`
- `SubjectCard`
- `TaskRow`
- `FileCard`
- `SearchField`
- `FilterChips`
- `StatusBadge`
- `EmptyState`
- `InlineError`
- `Toast`
- `Dialog`
- `BottomSheet`
- `SidePanel`
- `DocumentToolbar`
- `InkToolbar`
- `AutosaveIndicator`
- `BackupSummary`
- `Skeleton`

كل مكون يملك حالات Default، Hover عند توفره، Focus، Pressed، Disabled، Loading،
Error، واتجاه محتوى LTR/RTL التلقائي عند الحاجة.

## 19. Accessibility

- الهدف `WCAG 2.2 AA` للواجهة العامة.
- ترتيب Focus منطقي في Product Shell ذي اتجاه LTR.
- Focus ring واضح ولا يُزال.
- جميع الأيقونات التفاعلية تملك اسماً نصياً.
- تباين النصوص والإجراءات يحقق AA.
- دعم تكبير النص حتى 200% من دون فقد إجراء أساسي.
- التنقل بلوحة المفاتيح وEscape للحوارات وSheets.
- رسائل الأخطاء مرتبطة بالحقل وتوضح طريقة الإصلاح.
- حالات النجاح والفشل تُعلن عبر live region باعتدال.
- لا يعتمد اختيار الأداة أو حالة المهمة على اللون وحده.
- اختبار قارئ شاشة إنكليزي، واختبار محتوى مستخدم عربي/مختلط على Android عند التنفيذ.

## 20. حالة دعم العربية

هذه المواصفة تسجل الحالة ولا تدمج إصلاح العربية داخل PR #5:

- Arabic filenames rendering: implementation saved on a separate local branch.
- Arabic notes rendering: regression tests prepared separately.
- Arabic PDF canvas rendering: requires separate device diagnosis.

الفرع المنفصل ليس جزءاً من هذا PR، ولا يجوز ادعاء أن الإصلاح منشور أو مدمج.

## 21. نقل الوظائف الحالية بلا إعادة كتابة Core

### النهج

1. تجميد واجهة P3 الحالية كمرجع وظيفي قابل للتشغيل.
2. جرد العقود المستخدمة: Repository، Storage Profile، PDF adapter، Notes،
   Ink، Backup.
3. إنشاء طبقة `ViewModel/Presenter` داخل سطح Phase 4.5 تعتمد العقود الحالية.
4. بناء App Shell والمكونات المشتركة من دون تغيير Domain models.
5. نقل Route واحد كل مرة خلف Feature Flag.
6. تشغيل اختبار تكافؤ وظيفي مقابل P3 قبل تحويل المسار الافتراضي.
7. إبقاء Route القديم متاحاً للرجوع حتى نجاح MatePad.

### ممنوعات النقل

- نسخ منطق Repository إلى Components.
- تغيير Stable IDs أو أسماء IndexedDB.
- تحويل PDF أو Ink إلى صيغة جديدة.
- تشغيل Migration لمجرد تغيير UI.
- حذف P3 أو بياناتها قبل قبول البديل.
- إخفاء فشل Core برسالة نجاح شكلية.

### Rollback

إطفاء Feature Flag يعيد واجهة P3 الوظيفية مع نفس البيانات. لا يحتاج Rollback
إلى Restore أو Migration لأن Phase 4.5 لا تغير Schema.

## 22. معايير القبول

### مواصفة التصميم والتقدم المرحلي

- [x] وافق المستخدم على Information Architecture والتنقل الأساسي.
- [x] التنقل الرئيسي هو `Today / Study / Projects / Practice / Library`.
- [x] Product Shell إنكليزي LTR، ومحتوى المستخدم العربي/المختلط يختار اتجاهه تلقائياً.
- [x] الاتجاه البصري المرجعي هو `Warm Paper Academic Studio`.
- [x] أذن المستخدم ببدء App Shell والتنقل كأول شريحة معزولة.
- [ ] تُراجع Wireframes لكل شريحة قبل قبولها، من دون منع بدء Shell الأساسي.
- [ ] تُراجع Light/Dark tokens والتباين.
- [ ] تُراجع مساحات القلم على MatePad.

### التكافؤ الوظيفي عند التنفيذ لاحقاً

- [ ] Upload PDF والتنقل وZoom وFit width تعمل كما في النسخة الوظيفية.
- [ ] Notes وDraft تبقيان بعد Reload وإعادة الفتح.
- [ ] Ink والقلم وPalm rejection وAutosave لا تتراجع.
- [ ] Storage migration لا تتكرر ولا تنشئ نسخاً مكررة.
- [ ] Backup/Verify/Restore/Export تحتفظ بعقود Phase 4 نفسها.
- [ ] جميع Stable IDs والعلاقات تبقى بلا تغيير.

### UX والجهاز

- [ ] التنقل الرئيسي قابل للاستخدام باللمس والقلم ولوحة المفاتيح.
- [ ] Landscape وPortrait ينجحان بلا فقد محتوى أو إجراء.
- [ ] لا تغطي الأدوات مساحة الرسم الأساسية.
- [ ] الثيم يتغير بلا Reload أو فقد حالة.
- [ ] Touch targets الأساسية لا تقل عن 48dp.

### الإتاحة والجودة

- [ ] Keyboard navigation وFocus order ناجحان.
- [ ] فحص تباين AA ناجح.
- [ ] تكبير 200% لا يكسر الإجراءات الأساسية.
- [ ] لا توجد أخطاء Console حرجة.
- [ ] Visual regression للحالات الأساسية.
- [ ] Core وP0 وP3 regression تبقى ناجحة.

## 23. خطة الاختبارات المستقبلية

1. Component tests للحالات والتفاعل وLTR shell واتجاه المحتوى التلقائي.
2. Route integration tests مع Core adapters الحالية.
3. Functional parity suite بين P3 وPhase 4.5.
4. Visual regression لأربع نقاط استجابة وLight/Dark.
5. Accessibility audit آلي ثم يدوي.
6. MatePad device test للقلم وPDF وNotes وBackup.
7. Reload، browser close/reopen، وOffline smoke.
8. اختبار بيانات موجودة مسبقاً للتأكد أن UI الجديد يقرأها بلا Migration.

## 24. القرارات وحدود التنفيذ المرحلي

### قرارات اعتمدها المستخدم

1. الوجهات الرئيسية الخمس وترتيبها:
   `Today / Study / Projects / Practice / Library`.
2. Subjects داخل Study وDrawing Coach داخل Practice.
3. Tasks سياقية، Search عام، Settings ثانوية، وWorkspace يفتح للمستند والملاحظة والرسم.
4. `Warm Paper Academic Studio` هو الاتجاه البصري.
5. Product Shell إنكليزي LTR، مع اتجاه تلقائي للمحتوى العربي والمختلط.
6. P0 وP3 Functional Prototypes وليسا التصميم النهائي.

### فرضيات تُراجع شريحة بعد أخرى

1. تفاصيل Navigation Rail في Landscape وBottom Navigation في Portrait.
2. تفاصيل Unified Workspace في Landscape وPortrait.
3. Light/Dark tokens والمكونات المشتركة.
4. استخدام Feature Flag ومسار رجوع إلى P3 أثناء النقل.

هذه التفاصيل لا تمنع تنفيذ شريحة App Shell والتنقل المعزولة، لكنها تمنع اعتماد
تصميم نهائي أو تحويل Route قبل مراجعة الأدلة الخاصة بكل شريحة. Warm Paper يبقى
مرجعاً بصرياً معتمداً فقط، وليس واجهة المنتج النهائية. أول مهمة مؤهلة هي
`P4.5-UX-IMPLEMENTATION-001`، ولا تشمل Core أو Ink أو Phase 5.
