# Studio5 Project Status

آخر تحديث: 2026-08-08
المرحلة الحالية: `PARTIAL DEVICE GATE PASS`
الفرع النشط: `chore/studio5-autopilot-foundation`

هذه الوثيقة هي لوحة التنسيق المشتركة بين المستخدم وCodex والمشرف وأي وكيل آخر.
تعرض ما أُنجز، ما يجري الآن، وما يأتي لاحقاً، ولا تستبدل السلطة الحالية.

ترتيب السلطة:

1. أحدث قرار صريح ومؤرخ من المستخدم والمسجل في
   `docs/authority/STUDIO5_AUTHORITY_CURRENT_EN.md`.
2. `docs/authority/Studio5_One_Time_Full_Build_Spec_v5_AR.md` لبقية النطاق.
3. الاختبارات والـPull Requests كأدلة لحالة التنفيذ.
4. الوثائق القديمة للتاريخ فقط.

Studio5 منصة دائمة لخمس سنوات. يعطي التنفيذ الإنتاجي الأولوية للسنة الأكاديمية
الحالية، ولا يحذف السنوات اللاحقة من النطاق. لا تُبنى تفاصيلها وواجهاتها قبل
حاجتها الأكاديمية، بينما يبقى Core والعقود ونموذج البيانات قابلين للتوسع.
Web/PWA هو المسار الحالي وليس المنصة النهائية الوحيدة. Phase 5 جزء من Gate D
وليست نهاية Studio5.

> The current P3 and P0 interfaces are functional prototypes and are not the final Studio5 product design.

نجاح PDF/Notes وPDF Canvas على MatePad لا يعني إغلاق Phase 4 كلها ولا اعتماد
تصميم واجهة P3. تبقى P3 مرجعاً وظيفياً، بينما يبقى P0 Ink Prototype مستقلاً
وغير مضاف إلى Worker المنشور.

اتجاه المنتج المعتمد هو `Warm Paper Academic Studio`. Product Shell باللغة
الإنكليزية واتجاه التطبيق LTR، مع دعم اتجاه تلقائي لمحتوى المستخدم العربي
والمختلط. التنقل الرئيسي: `Today / Study / Projects / Practice / Library`.

## تحديثات Pull Requests حتى 2026-08-08

- PR #6: `Closed without merge`.
- PR #7: `Merged`؛ PDF Canvas:
  `AUTOMATED PASS / CLOUDFLARE PREVIEW PASS / MATEPAD VISUAL PASS`.
- PR #8: `Merged`؛ اكتملت Ink characterization/tests والوثائق المرتبطة.
- PR #9: `Merged`؛ Warm Paper visual prototype معتمد كمرجع فقط.
- PR #10: `Merged`؛ اكتملت مزامنة ملفات الدخول مع السلطة الحالية.
- PR #11: `Merged`؛ اكتملت Ink Batch 2 / pure coordinate transforms عبر squash
  merge مع نجاح الفحوص المسجلة. لا يُدّعى MatePad real multi-touch PASS.

## المتبقي لإغلاق Phase 4

- Ink داخل Worker.
- Pen/Palm Rejection داخل Worker.
- Full Backup/Verify/Restore على MatePad.
- Corrupted backup rejection.
- Low-storage/failure-safe tests.

لا تبدأ Phase 5 بعد.

## ترتيب القراءة لأي وكيل

1. `AGENTS.md`
2. `PROJECT_STATUS.md`
3. ملف المهمة المحدد داخل `docs/tasks/`
4. الوثائق المتخصصة المرتبطة بالمهمة
5. الكود والاختبارات الحالية

## ما أُنجز

### Foundation

- توثيق الرؤية والنطاق والمعمارية ونموذج البيانات والمخاطر ومعايير القبول.
- تثبيت Core دائم وعقود ونموذج بيانات قابلة للتوسع لخمس سنوات، مع أولوية إنتاجية
  للسنة الأكاديمية الحالية.
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

الاختبارات الوظيفية مغلقة، واعتمد المستخدم Web/PWA كمسار التنفيذ والإثبات الحالي
في `ADR-008`، لا كحصر نهائي للمنصة.

## العمل الجاري الآن

| Work ID | المهمة | الفرع | المالك | الحالة | الملفات المحجوزة |
|---|---|---|---|---|---|
| P2-CORE-001 | أساس نموذج Studio5 Core وSchema v1 والمهاجرات | `codex/phase2-core-foundation` | Codex | DONE - 7/7 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-001.md`, ملفات الحالة |
| P2-CORE-002 | قاعدة بيانات IndexedDB محلية وRecovery | `codex/p2-core-indexeddb` | Codex | IMPLEMENTED 14/14 - BROWSER PENDING | `packages/studio5-core/**`, `docs/tasks/P2-CORE-002.md`, ملفات الحالة |
| P2-CORE-003 | Repository APIs للسنوات والفصول والمواد | `codex/p2-academic-repository` | Codex | DONE - 19/19 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-003.md`, ملفات الحالة |
| DOCS-SOP-001 | دمج SOP وحزمة التعاون وتنظيف الملفات المضغوطة | `codex/docs-collaboration-sop` | Codex | DONE - DOCS CHECK + 19/19 + 12/12 | وثائق التعاون والحالة فقط |
| P2-CORE-004 | Schedule وLecture وTask domain + Schema v2 | `codex/p2-schedule-lecture-task` | Codex | DONE - 27/27 TESTS | `packages/studio5-core/**`, `docs/tasks/P2-CORE-004.md`, ملفات الحالة |
| GATE0-DEVICE-RESULTS | توثيق نتائج MatePad واعتماد ADR-008 | `codex/gate0-device-results` | Codex | DONE - DEVICE PASS / ADR ADOPTED | وثائق Gate 0 والقرارات والحالة |
| P2-CORE-005 | Today query engine محلي | `codex/p2-today-query-engine` | Codex | DONE - 33/33 TESTS | `today-query.mjs`, Repository، اختبارات Today، وثائق المهمة والحالة |
| P2-CORE-006 | FileArtifact intake وHash وImmutable original | `codex/p2-file-artifact-intake` | Codex | DONE - 44/44 TESTS | نماذج الملفات، Schema v3، content store، Repository، الاختبارات والوثائق |
| P2-CORE-007 | Notebook basics وInkDocument revisions | `codex/p2-notebook-basics` | Codex | DONE - 54/54 TESTS | Notebook/Ink models، Schema v4، Repository، الاختبارات والوثائق |
| P2-GATE-001 | ربط P0 Ink بـNotebook Core ونشر Demo | `codex/p2-notebook-demo-gate` | Codex | DONE - MATEPAD PASS | `prototype/p0-ink-web/**` ووثائق المهمة والحالة |
| P2-GATE-002 | شاشة تاريخ نسخ Ink والمعاينة والاستعادة الآمنة | `codex/p2-revision-history-ui` | Codex | DONE - MATEPAD PASS | `prototype/p0-ink-web/**` ووثائق المهمة والحالة |
| P2-GATE-RECONCILIATION | توحيد Gate 0 وإعداد اختبار Notebook/Revisions | `codex/p2-gate-reconciliation` | Codex | DONE - MERGED HISTORY / VERIFIED | وثائق Gate 0 والقرارات والحالة وتقرير اختبار MatePad |
| P2-GATE-DEVICE-PASS | إغلاق بوابة Notebook/Revisions على MatePad | `codex/p2-notebook-revision-device-pass` | Codex | DONE - 8/8 DEVICE PASS | تقرير الجهاز والحالة والتتبع والقرارات |
| P3-LF-001 | Lecture Capture وCloseout domain + Schema v5 | `codex/p3-lecture-capture-domain` | Codex | DONE - 63/63 + 15/15 REGRESSION | `packages/studio5-core/**` ووثائق المهمة والحالة |
| P3-LF-002 | تحويل Capture إلى Task ذري + Lecture Inbox | `codex/p3-capture-task-inbox` | Codex | DONE - 69/69 + 15/15 REGRESSION | `lecture-inbox.mjs` وRepository والاختبارات ووثائق المهمة |
| P3-LF-003 | واجهة Lecture Capture السريعة المستقلة | `codex/p3-lecture-capture-ui` | Codex | DONE - DEPLOYED V1 - 4/4 + 69/69 + 15/15 | `prototype/p3-lecture-capture-web/**` ووثائق المهمة والحالة |
| DOCS-ARCH-001 | سياسة فصل التجارب وقابلية استبدالها | `codex/docs-experimental-modularity-policy` | Codex | DONE - DOCS CHECK | قواعد الوكلاء وقرارات المعمارية وSOP والحالة |
| P3-LF-004 | واجهة Lecture Closeout المستقلة | `codex/p3-lecture-closeout-ui` | Codex | DONE - DEPLOYED V2 / EXPERIMENTAL | `prototype/p3-lecture-capture-web/closeout/**` وتكامل التنقل والبناء والاختبارات ووثائق المهمة |
| P3-COMP-001 | توحيد Phase 2 المقبولة مع خط Phase 3 وتثبيت نطاق الإكمال | `codex/p3-completion-foundation` | Codex | DONE - 69/69 + 15/15 + 8/8 | وثائق الحالة والتتبع والقرارات فقط |
| P3-LF-005 | Search وFavorites/Recent داخل Core | `codex/p3-search-favorites-core` | Codex | DONE - 76/76 + REGRESSION PASS | `packages/studio5-core/**` ووثائق المهمة والحالة والتتبع |
| P3-LF-006 | Offline Operation Queue محلي | `codex/p3-offline-operation-queue` | Codex | DONE - 83/83 + REGRESSION PASS | `packages/studio5-core/**` ووثائق المهمة والحالة والتتبع |
| P3-LF-007 | PDF/Notes + Library UI التجريبية | `codex/p3-pdf-notes-library` | Codex | DONE - DEVICE PASS / UI EXPERIMENTAL | Note Core و`prototype/p3-lecture-capture-web/library/**` ووثائق المهمة |
| P3-LF-008 | إصلاح منتقي PDF على MatePad/WebView | `codex/p3-pdf-upload-fix` | Codex | DONE - PDF UPLOAD DEVICE PASS | واجهة رفع المكتبة واختبار التوافق ووثائق المهمة |
| P3-LF-009 | منتقي ملفات نظام أصلي ظاهر على MatePad | `codex/p3-native-pdf-picker` | Codex | DONE - NATIVE PICKER DEVICE PASS | واجهة رفع المكتبة واختبار التوافق ووثائق المهمة |
| P3-LF-010 | عارض PDF.js محلي داخل المكتبة | `codex/p3-pdfjs-viewer` | Codex | DONE - NAV/ZOOM/FIT DEVICE PASS | Adapter العرض وواجهة Library وملفات بناء PDF.js |
| P4-REL-001 | Portable Backup/Restore/Export داخل Core | `codex/p4-backup-restore-core` | Codex | DONE - 95/95 + REGRESSION PASS | `backup.mjs` واختباراته ووثائق المهمة |
| P4-REL-002 | واجهة Backup/Restore/Export التجريبية | `codex/p4-backup-restore-ui` | Codex | CODE/CI PASS — FULL DEVICE BACKUP/RESTORE PENDING | Route `reliability/**` والبناء والاختبارات |
| P4-REL-003 | توحيد Storage Namespace ومهاجرة أسماء Phase 3 القديمة | `codex/p4-storage-consolidation` | Codex | PDF/NOTES STORAGE DEVICE PASS — FULL P4 GATE PENDING | عقد التخزين والمهاجرة وRuntimes مع إبقاء المصدر القديم |
| P4-HARD-001 | توافق Backup القديم وCI وبوابة إغلاق MatePad | `codex/p4-hardening-review` | Codex | CODE + CI PASS — FULL DEVICE GATE PENDING | `backup.mjs` واختباراته وCI وChecklist الجهاز |
| PRE-P5-FOUNDATION-001 | تثبيت develop وتنظيم الفروع والمعاينة وNative ومواصفات Phase 5/6 | `chore/pre-phase5-foundation` | Codex | READY FOR USER REVIEW - DOCS 9/9 + CI POLICY 7/7 + PR CI 3/3 | CI ووثائق الفروع والمعاينة وNative ومواصفات المرحلتين |
| P4-PREVIEW-001 | تجهيز Build ساكن وفحص الاستضافة المرتبطة بـGitHub | `chore/cloudflare-preview-readiness` | Codex | DONE - STATIC BUILD VERIFIED / PAGES SUPERSEDED | PR #3: GitHub Actions 3/3 على Node 22؛ Core 100/100 + Ink 15/15 + P3 22/22 + Static Preview PASS |
| P4-WORKERS-PREVIEW-001 | إعداد Workers Static Assets + Workers Builds | `chore/workers-static-preview` | Codex | DEPLOYED — PDF/NOTES DEVICE PASS; INK/BACKUP PENDING | Build `6e7ced6d` من `develop@ed1d175`؛ Production Worker فعّال |
| P4.5-UX-SPEC-001 | مواصفة بنية تجربة الاستخدام والواجهة الموحدة | `historical / merged` | Codex | DOCUMENTATION COMPLETE | `docs/PHASE_4_5_UX_FOUNDATION_SPEC_AR.md` ووثائق الحالة فقط |
| P4-INK-EXTRACT-002 | استخراج تحويلات Ink/Viewport إلى وحدة pure مع إبقاء P0 مطابقاً | `refactor/p0-ink-coordinate-transforms` | Codex | COMPLETE / MERGED — DEVICE MULTI-TOUCH NOT CLAIMED | PR #11 / FIX-2؛ build closure وService Worker وBuilt browser وOffline reopen وCI PASS؛ Pinch الموروث مسجل للدفعة اللاحقة |
| OPS-AUTOPILOT-001 | تأسيس تشغيل Studio5 عبر Skill ووكلاء A/B/C وأدوات scope/checks | `chore/studio5-autopilot-foundation` | Codex | LOCAL VERIFICATION PASS — DRAFT PR DELIVERY | Skill/tooling tests 31/31؛ Core 100/100؛ P0 91/91؛ P3 24/24؛ Worker dry-run PASS؛ لا Production ولا Batch 3 |

### نتيجة P2-CORE-001 المطلوبة

- Stable IDs لا تعتمد على أسماء المواد.
- كيانات AcademicYear وSemester وSubject.
- SubjectProfile وCapabilityPack كبيانات عامة.
- Snapshot محلي Versioned.
- Migration Registry مختبر.
- رفض العلاقات المكسورة والتكرار الصامت.
- Export/Import round-trip من دون فقد.

## القادم بعد المهمة الحالية

1. إكمال `OPS-AUTOPILOT-001` بالتسليم إلى Draft PR من دون Merge تلقائي.
2. Ink Batch 3 هو دفعة الفصل التالية المؤهلة، لكنه `NOT STARTED` ولا يبدأ ضمن
   مهمة Autopilot الحالية.
3. إكمال بوابات الجهاز المعلقة: Ink داخل Worker، القلم وPalm Rejection، وFull
   Backup/Verify/Restore بما يشمل PDF وNotes وInk وTasks ورفض النسخة التالفة
   وسيناريوهات التخزين المنخفض والفشل الآمن.
4. لا تبدأ Phase 5 قبل إغلاق البوابات الحالية وقرار المستخدم؛ وهي جزء من Gate D
   وليست نهاية Studio5.
5. لا يُقترح أو يُنشأ Stable Tag قبل إغلاق بوابة Phase 4 الكاملة.
6. تبقى واجهتا P3 وP0 مرجعين وظيفيين مستقلين ولا تُحذفان أو يعاد استخدام تصميمهما القديم.
7. مواقع Sites القديمة مجمدة، وGitHub هو المصدر الوحيد للكود.
8. لا يُدمج أي فرع دون موافقة المستخدم، ولا يوجد Merge تلقائي.

## المراحل اللاحقة المحفوظة

- Phase 3: Lecture Capture وCloseout وInbox وSearch وFavorites/Recent.
- Phase 4: Backup/Restore/Export وPrivacy/Lock وRecovery.
- Phase 4.5: UX Foundation وApp Shell ونقل الوظائف الحالية بلا تغيير Core.
- Phase 5: Drawing Coach Lite، وهي جزء من Gate D وليست نهاية Studio5.
- Phase 6: التكامل النهائي وHardening واختبارات الجهاز وRelease Candidate.

السنوات 2–5 وAI Council وDesktop Companion والتحكم بالكمبيوتر وCAD/BIM
والمزامنة المعقدة متعددة الأجهزة باقية في النطاق الخماسي. لا تُبنى تفاصيلها
وواجهاتها قبل حاجتها الأكاديمية أو قبل Gates وقرارات التصميم الخاصة بها.

## بروتوكول العمل بين عدة وكلاء

التنظيم: `A — Production`، و`B — Review & QA`، و
`C — Prototype & Architecture`.

1. Blockers first.
2. لا يبدأ العمل المتوازي إلا إذا كانت المهمة `PARALLEL-SAFE`.
3. تستخدم المهام Worktrees وفروعاً مستقلة، وتبقى الملفات المشتركة لمهمة واحدة في الوقت نفسه.
4. Codex ينفذ؛ المستخدم والمشرف يحسمان.
5. لا يوسع Codex النطاق من نفسه. أي اقتراح تغيير يوثق السبب والأثر والبدائل والقرار المطلوب.
6. كل Batch يقدم الملفات المعدلة والاختبارات ونتائجها والقيود المعروفة وRollback.
7. نهاية المهمة: `Commit + Push + Draft PR + Tests + STOP`.
8. لا Merge تلقائي.

أي حزمة مرجعية تُسلّم للمستخدم مستقبلاً تجمع في ملف عربي واحد باسم
`Studio5_Master_Current_AR.md`. لا يُنشأ هذا الملف ضمن المزامنة الحالية.

## سجل التسليم المختصر

| التاريخ | من | إلى | النتيجة |
|---|---|---|---|
| 2026-07-25 | P0 | Phase 2 | قبول سلوك التحريك والممحاة من المستخدم؛ كانت اختبارات الجهاز الطويلة معلقة وقت هذا التسليم ثم أُغلقت لاحقاً |
| 2026-07-25 | Codex | وكلاء Phase 2 | بدء P2-CORE-001 ووضع بروتوكول التنسيق المشترك |
| 2026-07-25 | P2-CORE-001 | P2-CORE-002 | Core Schema v1 وStable IDs والعلاقات والمهاجرات رُفعت، 7/7 اختبارات ناجحة |
| 2026-07-25 | P2-CORE-002 | P2-CORE-003 | IndexedDB وJournal وRecovery رُفعت، 14/14 اختبارات ناجحة، Browser smoke معلّق |
| 2026-07-25 | P2-CORE-003 | P2-CORE-004 | Academic Repository وFilters وRecovery guard رُفعت، 19/19 اختبارات ناجحة |
| 2026-07-25 | DOCS-SOP-001 | P2-CORE-004 | SOP وTraceability وتعليمات التعاون رُتبت، أزيلت الحزمة المضغوطة، ورفع الفرع |
| 2026-07-25 | P2-CORE-004 | P2-CORE-005 | Schema v2 وSchedule/Lecture/Task وFilters وTask lifecycle رُفعت، 27/27 ناجحة |
| 2026-07-25 | MatePad Gate 0 | ADR-008 | نجحت اختبارات الضغط وRecovery و15 دقيقة و1000 stroke؛ اعتمد المستخدم Web/PWA |
| 2026-07-25 | P2-CORE-005 | P2-CORE-006 | Today query محلي مع Agenda وتصنيف المهام وحدود توقيت صريحة، 33/33 ناجحة |
| 2026-07-25 | P2-CORE-006 | P2-CORE-007 | Schema v3 وإدخال ملفات محلي immutable مع SHA-256 وdedup وRecovery، 44/44 ناجحة |
| 2026-07-25 | P2-CORE-007 | Demo/Gate | Notebook وInkDocument وRevision history ضمن Schema v4، 54/54 ناجحة؛ واجهة MatePad هي الخطوة التالية |
| 2026-07-25 | P2-GATE-001 | المستخدم/MatePad | Demo v4 منشور؛ كان اختبار النسخ والاستعادة معلقاً وقت النشر ثم نجح بتاريخ 2026-07-27 |
| 2026-07-25 | P2-GATE-002 | المستخدم/MatePad | Demo v5 منشور؛ كان فحص تاريخ النسخ معلقاً وقت النشر ثم نجح بتاريخ 2026-07-27 |
| 2026-07-27 | Gate 0 + أحدث Phase 2 | P2-GATE-RECONCILIATION | توحيد تاريخ Gate 0؛ كانت بوابة Notebook/Revisions تنتظر MatePad وقت المصالحة ثم أُغلقت بنجاح |
| 2026-07-27 | المستخدم/MatePad | P2-GATE-001/002 | البنود الثمانية للنسخ والمعاينة والرجوع والاستعادة وإعادة الفتح نجحت بلا فقد بيانات |
| 2026-07-25 | P3-LF-001 | P3-LF-002 | Schema v5 وLecture Capture/Closeout/Resolution رُفعت بفرع مستقل؛ 63/63 Core و15/15 Ink regression ناجحة |
| 2026-07-25 | P3-LF-002 | P3-LF-003 | التحويل الذري إلى Task وLecture Inbox رُفعا بفرع مستقل؛ 69/69 Core و15/15 Ink regression ناجحة |
| 2026-07-25 | P3-LF-003 | المستخدم/MatePad | واجهة Capture مستقلة منشورة بخصوصية على Sites؛ الأنواع الخمسة والحفظ المحلي وInbox count تعمل، 4/4 + 69/69 + 15/15 ناجحة |
| 2026-07-26 | المستخدم | كل الوكلاء | اعتماد سياسة دائمة: كل واجهة قبل الدوام تجربة منفصلة قابلة للاستبدال أو التقاعد بلا فقد بيانات أو هدم بقية Studio5 |
| 2026-07-27 | المستخدم | Phase 3 | السماح بإكمال Phase 3 بفروع ووحدات مستقلة، على أن تصل نتيجة بوابة Notebook/Revisions لاحقاً |
| 2026-07-27 | P3-LF-004 | المستخدم | واجهة Closeout مستقلة نُشرت كنسخة Sites v2؛ 8/8 UI و69/69 Core و15/15 Ink ناجحة، وتنتظر تقييم الاستخدام |
| 2026-07-27 | P3-COMP-001 | Phase 3 Completion | توحدت نتيجة 8/8 MatePad مع Lecture Flow؛ نجحت اختبارات الرجوع 69/69 Core و15/15 Ink و8/8 Lecture UI |
| 2026-07-27 | P3-LF-005 | Phase 3 | Search وResourceMarker للمفضلة والحديثة ضمن Schema v6؛ 76/76 Core و15/15 Ink و8/8 Lecture UI ناجحة |
| 2026-07-27 | P3-LF-006 | Phase 3 | OfflineOperation ضمن Schema v7 مع idempotency واستعادة الانقطاع؛ 83/83 Core وRegression ناجحة |
| 2026-07-27 | P3-LF-007 | Phase 3 | Note Core وPDF Library المحلية ضمن Schema v8؛ 88/88 Core و13/13 UI و15/15 Ink ناجحة، والنشر هو البوابة التالية |
| 2026-07-27 | P3-LF-007 | المستخدم/MatePad | نُشرت Sites v3 بنجاح على مسار `/library/`؛ تنفيذ Phase 3 مكتمل وتبقى بوابة PDF/Notes على الجهاز قبل الإغلاق النهائي |
| 2026-07-27 | P3-LF-008 | المستخدم/MatePad | أُصلح منتقي PDF ليكون هدف لمس مباشر، وتحوّل Cache إلى network-first مع Offline fallback؛ نُشرت Sites v5 وتنتظر إعادة اختبار الجهاز |
| 2026-07-31 | Workers Build | Phase 4 Device Gate | نُشرت `develop@ed1d175` عبر Build `6e7ced6d` على Workers Static Assets |
| 2026-07-31 | المستخدم/MatePad | Phase 4 | PDF/Notes sub-gate PASS؛ Ink داخل Worker وFull Backup/Restore وبوابات الفشل الآمن ما زالت PENDING |
| 2026-07-31 | المستخدم | Phase 4.5 | تصنيف واجهة P3 كإثبات وظيفي فقط وطلب مواصفة UX قبل أي كود أو Phase 5 |
| 2026-07-31 | المستخدم | Product Direction | `Warm Paper Academic Studio`؛ English LTR shell؛ اتجاه تلقائي للمحتوى العربي/المختلط؛ التنقل `Today / Study / Projects / Practice / Library` |
| 2026-08-01 | PR #6 | Arabic content | Closed without merge |
| 2026-08-01 | PR #7 | PDF Canvas | Merged؛ `AUTOMATED PASS / CLOUDFLARE PREVIEW PASS / MATEPAD VISUAL PASS` |
| 2026-08-01 | PR #8 | P0 Ink | Merged؛ Characterization tests/documentation completed |
| 2026-08-01 | PR #9 | Warm Paper | Merged؛ visual prototype approved as reference only |
| 2026-08-01 | PR #10 | Authority | Merged؛ authority and repository entry documents synchronized |
| 2026-08-07 | PR #11 | P0 Ink | Merged؛ Batch 2 coordinate transforms complete; no MatePad real multi-touch PASS claimed |
| 2026-08-08 | OPS-AUTOPILOT-001 | Tooling/Governance | Autopilot foundation active؛ Batch 3 remains not started |
