# Studio5 Project Status

آخر تحديث: 2026-07-25  
المرحلة الحالية: `Phase 3 - Lecture Flow`
الفرع النشط: `codex/p3-lecture-capture-ui`

هذه الوثيقة هي لوحة التنسيق المشتركة بين المستخدم وCodex وClaude وأي وكيل آخر. تعرض ما أُنجز، ما يجري الآن، وما يأتي لاحقاً. لا تستبدل المواصفة السلطوية أو ملفات المهام.

## ترتيب القراءة لأي وكيل

1. `AGENTS.md`
2. `PROJECT_STATUS.md`
3. ملف المهمة المحدد داخل `docs/tasks/`
4. الوثائق المتخصصة المرتبطة بالمهمة
5. الكود والاختبارات الحالية

## ما أُنجز

### Foundation

- توثيق الرؤية والنطاق والمعمارية ونموذج البيانات والمخاطر ومعايير القبول.
- تثبيت قرار: السنة الأولى فقط فوق Core دائم.
- منع تثبيت أسماء المواد داخل Core.
- إنشاء مستودع Git وفروع مستقلة ومنع الدمج الآلي إلى `main`.

### Phase 1 - P0 Ink Prototype

- قلم وممحاة وضغط عند توفره.
- Zoom/Fit وPan/Pinch داخل أداة «تحريك» فقط.
- تجاهل لمس راحة اليد أثناء القلم والممحاة.
- ممحاة مقطعية لا تحذف الخط المتصل بالكامل.
- Autosave وCrash Journal واستعادة بعد إعادة الفتح.
- Undo/Redo وتصدير PNG وJSON.
- Offline cache.
- نشر نسخة خاصة على:
  `https://studio5-ink-lab.lharithl.chatgpt.site`
- التحقق الآلي الحالي: 12/12 اختباراً ناجحاً، Build وType Check وBrowser smoke ناجحة.

## عمل P0 المتبقي على الجهاز الحقيقي

- قياس ضغط قلم Huawei وتسجيل النتيجة.
- Force Kill من نظام MatePad ثم التحقق من آخر محاولة.
- جلسة رسم 15 دقيقة وقياس الراحة والتأخير.
- تجربة بيانات كبيرة تقارب 1000 stroke.

هذه اختبارات Gate باقية، لكنها لا تمنع بناء أجزاء Core المحايدة عن تقنية الواجهة.

## العمل الجاري الآن

| Work ID | المهمة | الفرع | المالك | الحالة | الملفات المحجوزة |
|---|---|---|---|---|---|
| P2-CORE-001 | أساس نموذج Studio5 Core وSchema v1 والمهاجرات | `codex/phase2-core-foundation` | Codex | DONE - 7/7 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-001.md`, ملفات الحالة |
| P2-CORE-002 | قاعدة بيانات IndexedDB محلية وRecovery | `codex/p2-core-indexeddb` | Codex | IMPLEMENTED 14/14 - BROWSER PENDING | `packages/studio5-core/**`, `docs/tasks/P2-CORE-002.md`, ملفات الحالة |
| P2-CORE-003 | Repository APIs للسنوات والفصول والمواد | `codex/p2-academic-repository` | Codex | DONE - 19/19 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-003.md`, ملفات الحالة |
| DOCS-SOP-001 | دمج SOP وحزمة التعاون وتنظيف الملفات المضغوطة | `codex/docs-collaboration-sop` | Codex | DONE - DOCS CHECK + 19/19 + 12/12 | وثائق التعاون والحالة فقط |
| P2-CORE-004 | Schedule وLecture وTask domain + Schema v2 | `codex/p2-schedule-lecture-task` | Codex | DONE - 27/27 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-004.md`, ملفات الحالة |
| P2-CORE-005 | Today query engine محلي | `codex/p2-today-query-engine` | Codex | DONE - 33/33 TESTS | `today-query.mjs`, Repository، اختبارات Today، وثائق المهمة والحالة |
| P2-CORE-006 | FileArtifact intake وHash وImmutable original | `codex/p2-file-artifact-intake` | Codex | DONE - 44/44 TESTS | نماذج الملفات، Schema v3، content store، Repository، الاختبارات والوثائق |
| P2-CORE-007 | Notebook basics وInkDocument revisions | `codex/p2-notebook-basics` | Codex | DONE - 54/54 TESTS | Notebook/Ink models، Schema v4، Repository، الاختبارات والوثائق |
| P2-GATE-001 | ربط P0 Ink بـNotebook Core ونشر Demo | `codex/p2-notebook-demo-gate` | Codex | DEPLOYED V4 - MATEPAD GATE PENDING | `prototype/p0-ink-web/**` ووثائق المهمة والحالة |
| P2-GATE-002 | شاشة تاريخ نسخ Ink والمعاينة والاستعادة الآمنة | `codex/p2-revision-history-ui` | Codex | DEPLOYED V5 - MATEPAD GATE PENDING | `prototype/p0-ink-web/**` ووثائق المهمة والحالة |
| P3-LF-001 | Lecture Capture وCloseout domain + Schema v5 | `codex/p3-lecture-capture-domain` | Codex | DONE - 63/63 + 15/15 REGRESSION | `packages/studio5-core/**` ووثائق المهمة والحالة |
| P3-LF-002 | تحويل Capture إلى Task ذري + Lecture Inbox | `codex/p3-capture-task-inbox` | Codex | DONE - 69/69 + 15/15 REGRESSION | `lecture-inbox.mjs` وRepository والاختبارات ووثائق المهمة |
| P3-LF-003 | واجهة Lecture Capture السريعة المستقلة | `codex/p3-lecture-capture-ui` | Codex | IN PROGRESS | `prototype/p3-lecture-capture-web/**` ووثائق المهمة والحالة |

### نتيجة P2-CORE-001 المطلوبة

- Stable IDs لا تعتمد على أسماء المواد.
- كيانات AcademicYear وSemester وSubject.
- SubjectProfile وCapabilityPack كبيانات عامة.
- Snapshot محلي Versioned.
- Migration Registry مختبر.
- رفض العلاقات المكسورة والتكرار الصامت.
- Export/Import round-trip من دون فقد.

## القادم بعد المهمة الحالية

1. P3-LF-003: واجهة Capture السريعة، بفرع مستقل بعد ثبات العقود.
2. P3-LF-004: واجهة Closeout، بفرع مستقل.
3. Search وFavorites/Recent وPDF تبقى دفعات لاحقة منفصلة داخل Phase 3.
4. يبقى Gate جهاز MatePad للمرحلة الثانية قابلاً للإصلاح في فرع Phase 2 من دون لمس Lecture Flow.

## المراحل اللاحقة المحفوظة

- Phase 3: Lecture Capture وCloseout وInbox وSearch وFavorites/Recent.
- Phase 4: Backup/Restore/Export وPrivacy/Lock وRecovery.
- Phase 5: Drawing Coach Lite.
- Phase 6: Hardening واختبارات الجهاز وRelease Candidate.

خارج النطاق الحالي: سنوات 2-5، AI Council، Desktop Companion، التحكم بالكمبيوتر، CAD/BIM، والمزامنة المعقدة متعددة الأجهزة.

## بروتوكول العمل بين عدة وكلاء

1. لا يبدأ الوكيل قبل وجود `Work ID` وملف مهمة وفرع مستقل.
2. لا يشارك وكيلان الفرع نفسه ولا يعدلان الملفات المحجوزة نفسها في الوقت نفسه.
3. يسجل الوكيل اسمه وفرعه وحالة `IN PROGRESS` قبل الكود.
4. يقرأ آخر commit من الفرع الأساسي قبل البدء، ولا يعيد كتابة تاريخ غيره.
5. لا يوسع النطاق من نفسه. أي اقتراح تغيير يوثق السبب والأثر والبدائل والقرار المطلوب.
6. كل Batch يجب أن يقدم: الملفات المعدلة، الاختبارات، نتائجها، القيود المعروفة، وRollback.
7. الحالة تصبح `DONE` فقط بعد Commit وPush ونجاح التحقق.
8. المراجعة المستقلة لا تعدل فرع المنفذ أولاً؛ تسجل تقريراً، ثم يعود الإصلاح للمنفذ.
9. لا Merge إلى `main` دون موافقة المستخدم.

## سجل التسليم المختصر

| التاريخ | من | إلى | النتيجة |
|---|---|---|---|
| 2026-07-25 | P0 | Phase 2 | قبول سلوك التحريك والممحاة من المستخدم، مع بقاء اختبارات الجهاز الطويلة |
| 2026-07-25 | Codex | وكلاء Phase 2 | بدء P2-CORE-001 ووضع بروتوكول التنسيق المشترك |
| 2026-07-25 | P2-CORE-001 | P2-CORE-002 | Core Schema v1 وStable IDs والعلاقات والمهاجرات رُفعت، 7/7 اختبارات ناجحة |
| 2026-07-25 | P2-CORE-002 | P2-CORE-003 | IndexedDB وJournal وRecovery رُفعت، 14/14 اختبارات ناجحة، Browser smoke معلّق |
| 2026-07-25 | P2-CORE-003 | P2-CORE-004 | Academic Repository وFilters وRecovery guard رُفعت، 19/19 اختبارات ناجحة |
| 2026-07-25 | DOCS-SOP-001 | P2-CORE-004 | SOP وTraceability وتعليمات التعاون رُتبت، أزيلت الحزمة المضغوطة، ورفع الفرع |
| 2026-07-25 | P2-CORE-004 | P2-CORE-005 | Schema v2 وSchedule/Lecture/Task وFilters وTask lifecycle رُفعت، 27/27 ناجحة |
| 2026-07-25 | P2-CORE-005 | P2-CORE-006 | Today query محلي مع Agenda وتصنيف المهام وحدود توقيت صريحة، 33/33 ناجحة |
| 2026-07-25 | P2-CORE-006 | P2-CORE-007 | Schema v3 وإدخال ملفات محلي immutable مع SHA-256 وdedup وRecovery، 44/44 ناجحة |
| 2026-07-25 | P2-CORE-007 | Demo/Gate | Notebook وInkDocument وRevision history ضمن Schema v4، 54/54 ناجحة؛ واجهة MatePad هي الخطوة التالية |
| 2026-07-25 | P2-GATE-001 | المستخدم/MatePad | Demo v4 منشور على رابط Studio5 الخاص؛ 15/15 وBuild ناجحة، وبقي اختبار القلم والاستعادة والنسخ على الجهاز |
| 2026-07-25 | P2-GATE-002 | المستخدم/MatePad | Demo v5 يعرض تاريخ النسخ والمعاينة والاستعادة الآمنة؛ 15/15 و54/54 وBuild ناجحة، وبقي فحص التدفق على الجهاز |
| 2026-07-25 | P3-LF-001 | P3-LF-002 | Schema v5 وLecture Capture/Closeout/Resolution رُفعت بفرع مستقل؛ 63/63 Core و15/15 Ink regression ناجحة |
| 2026-07-25 | P3-LF-002 | P3-LF-003 | التحويل الذري إلى Task وLecture Inbox رُفعا بفرع مستقل؛ 69/69 Core و15/15 Ink regression ناجحة |
