# مواصفة المرحلة السادسة — التكامل والاستقرار والإصدار

## الحالة

`SPECIFICATION ONLY — NOT IMPLEMENTED`

الفرع المستقبلي:

```text
feature/phase-6-final-integration
```

لا يُنشأ قبل اكتمال Phase 5 وموافقة المستخدم.

## الهدف

تحويل الوحدات المجربة إلى Release Candidate مترابط ومستقر للسنة الأولى. المرحلة
السادسة لا تضيف مجموعة ميزات جديدة؛ الأولوية لسلامة البيانات ثم الثبات ثم
الاختبارات ثم سهولة الاستخدام والأداء.

## قائمة التكامل

- Today النهائي يعرض المحاضرات والمهام والمراجعات والتمرين المقترح.
- Subject يربط Lectures وFiles وNotes وTasks وDrawing Assignments.
- Lecture Capture وCloseout وLibrary ضمن تنقل واحد.
- PDF وNotes وInk داخل سياق مادة/محاضرة واضح.
- Drawing Coach يستهلك عقود Core لا ملفات Prototype مباشرة.
- Search موحد للمواد والمحاضرات والملفات والملاحظات والمهام والمحاولات.
- Favorites وRecent موحدان.
- Settings وBackup/Restore وStorage health.
- Onboarding قصير يجهز السنة والفصل والمواد من دون hardcode.
- Feature Flags تفصل التجارب غير المقبولة.

## التنقل والشاشات النهائية

- Today.
- Study/Subjects.
- Lecture workspace.
- Library/PDF/Notes.
- Tasks.
- Drawing Coach.
- Search.
- Reliability/Backup.
- Settings.

تُزال الروابط المكررة فقط بعد وجود بديل مختبر، ولا تُحذف بيانات Prototype عند
تقاعد واجهته.

## متطلبات الأداء الأولية

تُقاس على MatePad المستهدف وببيانات اختبار موثقة:

- فتح دافئ إلى واجهة قابلة للاستخدام: هدف ≤2.5 ثانية.
- فتح بارد: هدف ≤5 ثوانٍ.
- إجراء القلم يجب ألا ينتظر كتابة IndexedDB متزامنة.
- Zoom/Pan والرسم يستهدفان استجابة 60fps؛ أي هبوط طويل موثق كفشل أداء.
- فتح PDF 100MB أو 500 صفحة دون crash؛ render صفحة واحدة في كل مرة مع إلغاء
  العمل القديم.
- جلسة Ink 60 دقيقة و5000 strokes بلا فقد وبلا نمو غير محدود.
- Search على 10,000 عنصر يعيد أول نتائج خلال هدف 500ms محلياً.

الأهداف ليست ادعاء نجاح؛ تُعدل فقط بعد قياس موثق وقرار.

## ميزانية الذاكرة

- هدف working set طبيعي ≤300MB أثناء PDF متوسط + Note + Ink.
- لا يزيد الاستهلاك المستقر أكثر من 20% بعد خمس دورات فتح/إغلاق لنفس PDF.
- تحرير PDF page canvases وworkers وBlob URLs عند مغادرة الشاشة.
- لا تحميل لجميع صفحات PDF أو جميع revisions إلى الذاكرة دفعة واحدة.
- عند ضغط الذاكرة، يحفظ التطبيق أولاً ثم يقلل caches غير الأساسية.
- قتل النظام للتطبيق أو فقد الرسومات يُعد blocker للإصدار.

## اختبارات الضغط

- 10,000 عنصر بحث.
- 1,000 مهمة وملاحظة موزعة على مواد.
- PDF كبير ومشفّر/تالف/ناقص.
- 5,000 strokes مع Undo/Redo وrevisions.
- 100 عملية Offline Queue وإعادة تشغيل أثناء المعالجة.
- Backup كبير مع PDF وInk ثم verify/restore.
- تشغيل مستمر ساعتين مع التنقل بين الوحدات.

## اختبارات الفشل

- Force-kill أثناء Autosave.
- إغلاق أثناء PDF render.
- نفاد/انخفاض مساحة التخزين.
- إلغاء File Picker.
- فشل Backup download.
- Backup digest/count/content تالف.
- إلغاء Restore قبل التأكيد.
- انقطاع الطاقة/الاتصال أثناء عملية non-critical.
- Migration قديمة صحيحة وMigration فاشلة مع Recovery.
- Service Worker قديم أمام build جديد.

## Device Matrix

| البيئة | الغرض |
|---|---|
| HUAWEI MatePad 11.5 PaperMatte + قلم | بوابة الإصدار الأساسية |
| Chrome/Edge حديث على Windows | إدارة الملفات والتشخيص |
| متصفح Android/HarmonyOS بدون قلم | اللمس وPDF والمهام |
| Offline/PWA standalone على MatePad | lifecycle والحفظ |
| Storage منخفض | الفشل الآمن |

لا تصبح بيئة desktop بديلاً عن MatePad.

## Accessibility

- أهداف لمس مناسبة للقلم والإصبع.
- Focus مرئي وتنقل لوحة مفاتيح أساسي.
- RTL صحيح وعدم الاعتماد على اللون وحده.
- labels للأزرار والحقول.
- Zoom النص لا يكسر الأدوات.
- أدوات القلم لا تمنع استخدام اللمس في التنقل.
- رسائل الخطأ تذكر العملية وما إذا كانت البيانات الأصلية آمنة.

## قائمة الأخطاء الحرجة Blockers

- فقد أو تكرار بيانات.
- Restore جزئي أو صامت.
- فتح Backup تالف كأنه صالح.
- Ink مفقود/متغير بعد reopen.
- PDF أو Note مرتبطة بسجل خاطئ.
- Migration غير idempotent.
- شاشة فارغة تمنع الوصول للـBackup.
- crash متكرر أو تجمد طويل في التدفق الأساسي.
- تسرب بيانات إلى origin/حساب آخر مستقبلاً.

## معايير Release Candidate

1. جميع lint/typecheck/tests/build وCI ناجحة.
2. جميع Migrations مدعومة باختبارات من أقدم Schema محتفظ بها.
3. Backup الحالي والقديم verify/restore بلا فقد.
4. Device Matrix الأساسية ناجحة، خصوصاً MatePad.
5. لا Blocker مفتوح.
6. كل واجهة مصنفة Accepted أو Experimental مخفية افتراضياً أو Retired بأمان.
7. الأداء والذاكرة مقاسان لا مفترضان.
8. Preview يبني SHA من GitHub.
9. دليل المستخدم وRecovery وPrivacy وKnown Issues مكتملة.
10. موافقة المستخدم الصريحة على RC.

## خطة Rollback

- Tag للـRC لا يُنشأ بلا موافقة.
- الاحتفاظ بآخر Backup format قابل للقراءة.
- تحديث التطبيق لا يحذف قاعدة قديمة قبل verify وmigration ناجحة.
- عند فشل migration: عدم استبدال الأصل، عرض Recovery، والسماح بالتصدير.
- Revert عبر PR، لا force push.
- Service Worker يستخدم cache version جديداً ويزيل القديم بعد activation الآمن.

## الوثائق المطلوبة

- Release notes.
- Supported schemas/migrations.
- Backup/Restore guide.
- MatePad test report.
- Performance report.
- Known issues.
- Privacy/data location.
- Preview/build instructions.
- Native-wrapper future plan.
- Branch/tag/release record.

## المؤجل لما بعد الإصدار الأول

- AI Council وتقييم معماري متقدم.
- CAD/BIM وDesktop Companion.
- Cloud sync المعقدة والتعاون.
- حسابات متعددة.
- السنوات 2–5.
- Native rewrite.
- ميزات اجتماعية أو سوق محتوى.
