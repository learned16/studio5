# Studio5 Project Status

آخر تحديث: 2026-07-25  
المرحلة الحالية: `Phase 2 - Core`  
الفرع النشط: `codex/gate0-device-results`

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

## نتيجة Gate 0 على الجهاز الحقيقي

- ضغط قلم Huawei: PASS.
- Palm rejection والممحاة المقطعية بعد الإصلاح: PASS.
- Force Kill + Recovery: PASS بلا فقد.
- جلسة رسم 15 دقيقة: PASS بلا تأخير ملحوظ.
- قرابة 1000 stroke: PASS للحفظ وإعادة الفتح.

الاختبارات الوظيفية مغلقة. توصية Web/PWA في `ADR-008` تنتظر موافقة المستخدم قبل
تسجيلها `Adopted`.

## العمل الجاري الآن

| Work ID | المهمة | الفرع | المالك | الحالة | الملفات المحجوزة |
|---|---|---|---|---|---|
| P2-CORE-001 | أساس نموذج Studio5 Core وSchema v1 والمهاجرات | `codex/phase2-core-foundation` | Codex | DONE - 7/7 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-001.md`, ملفات الحالة |
| P2-CORE-002 | قاعدة بيانات IndexedDB محلية وRecovery | `codex/p2-core-indexeddb` | Codex | IMPLEMENTED 14/14 - BROWSER PENDING | `packages/studio5-core/**`, `docs/tasks/P2-CORE-002.md`, ملفات الحالة |
| P2-CORE-003 | Repository APIs للسنوات والفصول والمواد | `codex/p2-academic-repository` | Codex | DONE - 19/19 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-003.md`, ملفات الحالة |
| DOCS-SOP-001 | دمج SOP وحزمة التعاون وتنظيف الملفات المضغوطة | `codex/docs-collaboration-sop` | Codex | DONE - DOCS CHECK + 19/19 + 12/12 | وثائق التعاون والحالة فقط |
| P2-CORE-004 | Schedule وLecture وTask domain + Schema v2 | `codex/p2-schedule-lecture-task` | Codex | DONE - 27/27 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-004.md`, ملفات الحالة |
| GATE0-DEVICE-RESULTS | توثيق نتائج MatePad واقتراح ADR-008 | `codex/gate0-device-results` | Codex | DONE - DEVICE PASS / ADR NEEDS DECISION | وثائق Gate 0 والقرارات والحالة |

### نتيجة P2-CORE-001 المطلوبة

- Stable IDs لا تعتمد على أسماء المواد.
- كيانات AcademicYear وSemester وSubject.
- SubjectProfile وCapabilityPack كبيانات عامة.
- Snapshot محلي Versioned.
- Migration Registry مختبر.
- رفض العلاقات المكسورة والتكرار الصامت.
- Export/Import round-trip من دون فقد.

## القادم بعد المهمة الحالية

1. `P2-CORE-005`: Today query engine يعمل دون شبكة.
2. `P2-CORE-006`: FileArtifact intake وhash وكشف التكرار وعدم تعديل الأصل.
3. `P2-CORE-007`: Notebook basics وربط InkDocument بالمواد والمحاضرات.
4. Demo مرحلي على MatePad وقرار Go/No-Go قبل Lecture Flow.

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
| 2026-07-25 | MatePad Gate 0 | ADR-008 | نجحت اختبارات الضغط وRecovery و15 دقيقة و1000 stroke؛ توصية Web/PWA تنتظر موافقة المستخدم |
