# مواصفة المرحلة الخامسة — Drawing Coach

## الحالة

`SPECIFICATION ONLY — NOT IMPLEMENTED`

الفرع المستقبلي بعد موافقة المستخدم ودمج أعمال ما قبل المرحلة الخامسة في
`develop`:

```text
feature/phase-5-drawing-coach
```

لا يُنشأ الفرع ولا يبدأ الكود بهذه المهمة.

## الهدف

مدرب يعلم الرسم من خلال حلقة قابلة للقياس:

```text
Learn → Warm up → Guided Attempt → Independent Attempt
→ Measure → Explain Error → Remedial Exercise → Retest → Progress
```

ليس Canvas فارغاً، وليس مكتبة فيديوهات، ولا يدعي فهم الجمال أو الإبداع مثل
الأستاذ.

## نطاق الإصدار الأول

1. خريطة مهارات عامة لا تعتمد أسماء مواد hardcoded.
2. ثلاثة مسارات: الرسم الحر، الرسم الهندسي، أساسيات التصميم المعماري.
3. دروس وتمارين ومحاولات وقياسات وأخطاء وتقدم.
4. Guided وIndependent attempts.
5. ربط التمرين بواجب دكتور اختياري.
6. العمل Offline والحفظ المحلي وBackup.
7. قياسات هندسية موثوقة فقط؛ التقييم الفني النوعي يبقى Checklist/Feedback.

## المسارات والمحتوى

### الرسم الحر

- التحكم بالقلم والخطوط الطويلة.
- دوائر وEllipses.
- أشكال 2D و3D والنسب.
- التظليل والضوء والظل.
- منظور نقطة ونقطتين.
- تمارين يومية وسجل تقدم.

### الرسم الهندسي

- أنواع الخطوط وسماكاتها.
- الزوايا والقياس والمقياس والأبعاد.
- الإنشاءات الهندسية الأساسية.
- الإسقاط المتعامد.
- المسقط والواجهة والقطاع.
- Isometric وتمارين قابلة للقياس.

### أساسيات التصميم المعماري

- الشكل والوظيفة.
- العلاقات بين المساحات والحركة.
- الكتلة والفراغ والتكوين.
- الإيقاع والتوازن والنسب والمقياس الإنساني.
- تحليل موقع بسيط وBubble diagrams.
- تمارين تصميم صغيرة وChecklists لمراجعة الحل.

## User Journeys

### تمرين يومي

1. تظهر مهارة اليوم وسبب اختيارها وخطأ سابق مرتبط.
2. يقرأ المستخدم هدفاً وشرحاً بصرياً قصيراً.
3. ينفذ Warm-up.
4. ينفذ محاولة موجهة مع Guides اختيارية.
5. ينفذ محاولة مستقلة.
6. يرى القياسات والأخطاء القابلة للإثبات.
7. يحفظ التقدم أو يعيد تمريناً علاجياً.

### واجب الدكتور

1. يضيف المستخدم صورة/PDF/نص المطلوب والموعد.
2. يحدد بنفسه أو بمساعدة قواعد بسيطة المهارات المطلوبة.
3. ينفذ تشخيصاً صغيراً.
4. يحصل على خطة تمهيدية ثم محاولة الواجب.
5. يربط ملاحظة الدكتور بمحاولة وخطأ وتمرين علاجي.
6. ينفذ Checklist جاهزية التسليم.

### اختبار إتقان

1. يختار النظام تمريناً مستقلاً بلا Ghost/Guides.
2. يبدأ Timer وتُحفظ المحاولة تلقائياً.
3. يقاس الناتج وفق Rubric معلنة.
4. لا ترتفع حالة الإتقان إن لم ينجح التطبيق المستقل.

## الشاشات

- **Drawing Coach Home:** تمرين اليوم، الواجبات، الأخطاء، التقدم، الاختبارات.
- **Skill Map:** المسارات والمهارات والمتطلبات السابقة.
- **Lesson:** الهدف، شرح مختصر، مثال صحيح/خاطئ وخطوات.
- **Exercise Workspace:** المرجع، Canvas، الأدوات، Guides، Timer، Autosave.
- **Attempts:** قائمة المحاولات وSide-by-side وOverlay.
- **Assignment Mode:** المطلوب، المهارات، الخطة، ملاحظات الدكتور وChecklist.
- **Error Memory:** الخطأ وتكراره ودليله والتمرين العلاجي وحالته.
- **Test Center:** تشخيصي وإتقان وزمني وعملي وجاهزية تسليم.
- **Progress:** دليل التقدم لا مجرد نسبة مشاهدة.

## نموذج البيانات

كيانات Core المقترحة، بمعرفات Stable IDs:

- `Skill` و`SkillPrerequisite`.
- `Lesson`.
- `Exercise` و`ExerciseStep`.
- `ExerciseRubric`.
- `Attempt` و`AttemptMode`.
- `InkArtifactRef` و`ReferenceArtifactRef`.
- `MeasurementResult`.
- `DetectedError` و`ErrorOccurrence`.
- `RemedialPlan`.
- `Assignment` و`AssignmentRequirement`.
- `ProfessorFeedback`.
- `TestDefinition` و`TestResult`.
- `ProgressEvidence`.

لا تُخزن strokes داخل كيان Attempt الضخم؛ تُحفظ كـInk artifact/revision ويرتبط
Attempt بمعرفه. أي Schema جديد يحتاج Migration واختبار Backup/Restore.

## أنواع التمارين

- خط/مجموعة خطوط.
- Shape tracing اختياري.
- Copy from reference.
- Construct from instructions.
- Perspective convergence.
- Proportion matching.
- Orthographic projection.
- Timed drawing.
- Error identification في مثال جاهز.
- Assignment practice.
- Independent mastery challenge.

## نظام القياس

يقيس فقط ما يمكن حسابه بوضوح:

- استقامة الخط واهتزازه.
- التوازي والتعامد والزوايا.
- النسب والمسافات.
- إغلاق الشكل.
- تقارب خطوط المنظور نحو نقطة الهروب.
- انتظام سماكة/ضغط الخط عند توفر pressure.
- اكتمال الخطوات والمتطلبات.
- الوقت وعدد المحاولات وUndo.
- الفرق عن محاولة سابقة بنفس Rubric.

كل نتيجة تعرض:

- القيمة المقاسة ووحدتها.
- الحد المطلوب.
- مكان الخطأ بصرياً إن أمكن.
- درجة ثقة عند وجود استدلال.
- تمرين تحسين مقترح.

لا توجد درجة «إبداع» آلية في الإصدار الأول.

## نظام التقدم

```text
Not Started
→ Learned
→ Guided
→ Independent
→ Accurate
→ Timed
→ Applied in Assignment
→ Mastered
```

- مشاهدة الشرح لا تكفي للترقية.
- `Mastered` يحتاج محاولتين مستقلتين ناجحتين في يومين مختلفين أو معياراً معتمداً
  لكل مهارة.
- انخفاض الأداء لاحقاً يعيد المهارة إلى `Needs Review` ولا يمحو الأدلة القديمة.

## متطلبات القلم ومساحة الرسم

- Pen، eraser مقطعية، Undo/Redo، Zoom/Pan بوضع تحريك واضح.
- Pressure وPalm rejection عندما يوفر الجهاز البيانات.
- Reference وSplit view وOverlay وGhost اختياري.
- Grid وIsometric/Perspective guides.
- Autosave وCrash recovery وRevision history.
- Guided tools يمكن إخفاؤها بالكامل في المحاولة المستقلة.
- تصدير صورة وPDF/JSON وفق صيغ Core المعتمدة.

## Offline

- بدء الدروس المحملة وتمارينها دون اتصال.
- حفظ كل المحاولات والقياسات محلياً.
- Queue للعمليات غير الحرجة.
- فشل الشبكة لا يمنع الرسم أو الاختبار.
- أي محتوى غير محمل يظهر بوضوح ولا يولد درساً وهمياً.

## Accessibility

- أهداف لمس كبيرة وواضحة.
- عدم الاعتماد على اللون وحده.
- نصوص واتجاه RTL مع مصطلح إنكليزي عند الحاجة.
- اختصارات لوحة مفاتيح اختيارية.
- إعدادات لتكبير النص والمرجع.
- بديل نصي للتعليمات المرئية.
- عدم إجبار المستخدم على ثبات يد/سرعة واحدة؛ Rubrics قابلة للتخصيص الموثق.

## الاختبارات

- Unit: القياسات، Rubrics، progression، stable IDs.
- Property tests: التحويل بين إحداثيات viewport وdocument.
- Persistence: autosave وforce-kill وreopen.
- Migration وBackup/Restore لكل كيان جديد.
- UI: Guided/Independent، إخفاء الأدلة، retake، feedback.
- Performance: 1000 و5000 strokes، جلسة 60 دقيقة.
- Device: MatePad pressure/palm rejection/zoom/eraser.
- Offline: إغلاق الشبكة أثناء Attempt وعودة آمنة.
- Data corruption: رفض artifact أو measurement تالف بلا حذف الأصل.

## معايير القبول

1. يبدأ المستخدم تمريناً وله هدف وRubric معلنان.
2. المحاولة المستقلة لا تعرض Guides الممنوعة.
3. لا تضيع محاولة بعد force-kill.
4. يمكن مقارنة محاولتين وفتح مصدر القياس.
5. الخطأ المتكرر يؤدي إلى تمرين علاجي قابل للتبرير.
6. التقدم يعتمد على Evidence لا المشاهدة.
7. كل الوظائف الأساسية تعمل Offline.
8. Backup/Restore يعيدان المحاولات والروابط والقياسات.
9. لا توجد ادعاءات تقييم فني غير قابلة للاختبار.
10. ينجح Device Gate على MatePad قبل اعتبار المرحلة مكتملة.

## المخاطر

- latency وذاكرة Canvas مع الجلسات الطويلة.
- اختلاف pressure/palm rejection بين browser والغلاف المستقبلي.
- قياسات مضللة بسبب zoom/rotation إن لم تُستخدم document coordinates.
- تشجيع المستخدم على مطاردة الدرجة بدلاً من جودة الرسم.
- تضخم المحتوى قبل ثبات المحرك.
- ربط واجب الدكتور بتقييم آلي غير مناسب للسياق.

## المؤجل

- AI بصري للحكم الفني.
- إنشاء دروس تلقائي كامل.
- تعاون أو مشاركة عامة.
- CAD/BIM.
- 3D modeling.
- مزامنة متعددة الأجهزة.
- مكتبة محتوى تجارية.
