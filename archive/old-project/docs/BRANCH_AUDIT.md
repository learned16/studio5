# تدقيق فروع Studio5 قبل المرحلة الخامسة

**تاريخ التدقيق:** 2026-07-29

**آخر `git fetch --all --prune`:** ناجح

**مرجع المقارنة:** `origin/develop` عند `2f5196c`

## الخلاصة

- أحدث نسخة متكاملة ومختبرة هي `codex/p4-hardening-review` عند `2f5196c`.
- أُنشئ `develop` من SHA نفسه بلا Merge أو rebase أو إعادة كتابة تاريخ.
- `main` تاريخ رسمي منفصل لكنه ليس قاعدة Phase 5 ولا يحتوي التطبيق المتكامل
  الحالي.
- غالبية فروع P0–P4 هي ancestors داخل `develop`.
- فرعا P0 canvas وP3 PDF.js يحتويان commits غير موجودة بالهوية داخل `develop`,
  لكن الشجرة المتكاملة تحتوي تطبيقات أحدث فوق نفس القدرات؛ لا يُدمجان آلياً.
- فروع Sites قديمة وغير سلطوية. لا تُحذف الآن ولا تُدمج في `develop`.

## معنى أرقام المقارنة

`D/B` تعني:

- `D`: عدد commits الموجودة في `develop` وغير الموجودة في الفرع.
- `B`: عدد commits الموجودة في الفرع وغير الموجودة في `develop`.

عندما تكون `B=0` فالفرع مضمّن تاريخياً داخل `develop` ولا يحمل commit فريداً.

## الفروع السلطوية والحالية

| الفرع | SHA | التاريخ | D/B | ملفات/عمل فريد عن develop | التصنيف | التوصية |
|---|---:|---:|---:|---|---|---|
| `origin/develop` | `2f5196c` | 2026-07-29 | 0/0 | لا | الفرع التجميعي المعتمد | احتفاظ؛ قاعدة العمل المستقبلية |
| `origin/codex/p4-hardening-review` | `2f5196c` | 2026-07-29 | 0/0 | لا | أحدث Phase 4 hardening | احتفاظ حتى إغلاق PR والجهاز |
| `origin/codex/p4-storage-consolidation` | `2c8381a` | 2026-07-29 | 1/0 | لا | قاعدة Phase 4 السابقة | أرشفة بعد الإغلاق |
| `origin/main` | `542532f` | 2026-07-28 | 63/4 | نعم؛ تاريخ baseline توثيقي منفصل، لا تطبيق أحدث | رسمي لكنه متأخر | احتفاظ؛ لا Merge ولا بدء Phase 5 منه |

## الفروع المضمّنة بالكامل في develop

كل صف هنا له `B=0` ولا يحتوي ملفات فريدة مطلوبة غير موجودة في `develop`.

| الفرع | SHA | التاريخ | D/B | التصنيف | التوصية |
|---|---:|---:|---:|---|---|
| `origin/codex/docs-collaboration-sop` | `8f665fe` | 2026-07-25 | 53/0 | توثيق مكتمل | أرشفة؛ مرشح حذف لاحق بعد Tag |
| `origin/codex/docs-experimental-modularity-policy` | `593c578` | 2026-07-26 | 32/0 | توثيق مكتمل | أرشفة |
| `origin/codex/gate0-device-results` | `11df8bf` | 2026-07-25 | 48/0 | دليل جهاز مكتمل | احتفاظ حتى إصدار مستقر |
| `origin/codex/p0-ink-prototype` | `4fd469f` | 2026-07-25 | 60/0 | مرحلة P0 | أرشفة |
| `origin/codex/p2-academic-repository` | `377258a` | 2026-07-25 | 55/0 | P2 مكتمل | أرشفة |
| `origin/codex/p2-core-indexeddb` | `4723c71` | 2026-07-25 | 57/0 | P2 مكتمل | أرشفة |
| `origin/codex/p2-file-artifact-intake` | `4fde1e0` | 2026-07-25 | 47/0 | P2 مكتمل | أرشفة |
| `origin/codex/p2-gate-reconciliation` | `eb1db64` | 2026-07-27 | 34/0 | Gate reconciliation | احتفاظ كدليل ثم أرشفة |
| `origin/codex/p2-notebook-basics` | `25e1692` | 2026-07-25 | 45/0 | P2 مكتمل | أرشفة |
| `origin/codex/p2-notebook-demo-gate` | `028a229` | 2026-07-25 | 42/0 | Prototype gate | أرشفة |
| `origin/codex/p2-notebook-revision-device-pass` | `68c377e` | 2026-07-27 | 32/0 | Device pass | احتفاظ كدليل |
| `origin/codex/p2-revision-history-ui` | `46df104` | 2026-07-25 | 40/0 | P2 UI | أرشفة |
| `origin/codex/p2-schedule-lecture-task` | `2cc2142` | 2026-07-25 | 51/0 | P2 Core | أرشفة |
| `origin/codex/p2-today-query-engine` | `d8f0ee7` | 2026-07-25 | 49/0 | P2 Core | أرشفة |
| `origin/codex/p3-capture-task-inbox` | `95bd14d` | 2026-07-25 | 36/0 | P3 Core | أرشفة |
| `origin/codex/p3-completion-foundation` | `9f662ac` | 2026-07-27 | 19/0 | Phase milestone | احتفاظ مؤقت |
| `origin/codex/p3-lecture-capture-domain` | `75dff8b` | 2026-07-25 | 38/0 | P3 Core | أرشفة |
| `origin/codex/p3-lecture-capture-ui` | `747e3c6` | 2026-07-25 | 34/0 | P3 UI | أرشفة |
| `origin/codex/p3-lecture-closeout-ui` | `fe35312` | 2026-07-27 | 23/0 | P3 UI | أرشفة |
| `origin/codex/p3-native-pdf-picker` | `8f80e83` | 2026-07-28 | 10/0 | P3 fix | أرشفة |
| `origin/codex/p3-offline-operation-queue` | `dd1023c` | 2026-07-27 | 17/0 | P3 Core | أرشفة |
| `origin/codex/p3-pdf-notes-library` | `38a1738` | 2026-07-27 | 15/0 | P3 UI/Core | أرشفة |
| `origin/codex/p3-pdf-upload-fix` | `6c185af` | 2026-07-27 | 12/0 | P3 fix | أرشفة |
| `origin/codex/p3-search-favorites-core` | `6f0cc52` | 2026-07-27 | 18/0 | P3 Core | أرشفة |
| `origin/codex/p4-backup-restore-core` | `e50fa77` | 2026-07-28 | 8/0 | P4 Core | احتفاظ حتى Stable Tag ثم أرشفة |
| `origin/codex/p4-backup-restore-ui` | `6ed0674` | 2026-07-28 | 5/0 | P4 UI | احتفاظ حتى Device Gate |
| `origin/codex/phase-0` | `da61366` | 2026-07-25 | 62/0 | milestone مكرر مع setup | احتفاظ كمعلم تاريخي |
| `origin/codex/phase-2` | `9f662ac` | 2026-07-27 | 19/0 | milestone مكرر مع completion | احتفاظ كمعلم تاريخي |
| `origin/codex/phase2-core-foundation` | `be8b7d9` | 2026-07-25 | 58/0 | P2 foundation | أرشفة |
| `origin/setup/project-foundation` | `da61366` | 2026-07-25 | 62/0 | مكرر مع phase-0 | مرشح حذف لاحق بعد مراجعة |

## فروع تحتاج مراجعة قبل أي حذف

| الفرع | SHA | التاريخ | D/B | الملفات/العمل الفريد | الحكم | التوصية |
|---|---:|---:|---:|---|---|---|
| `origin/codex/p0-expand-drawing-canvas` | `dbd977d` | 2026-07-25 | 51/2 | commit UI وتوثيق canvas؛ شجرة الفرع أقدم من P0 الحالي | غير مدمج بالهوية، القدرة مستبدلة بإصدار أحدث | احتفاظ/مراجعة؛ ممنوع auto-merge |
| `origin/codex/phase-1` | `dbd977d` | 2026-07-25 | 51/2 | نفس tip السابق | مكرر pointer لـP0 expand | احتفاظ كمعلم حتى التأكد |
| `origin/codex/p3-pdfjs-viewer` | `5f61600` | 2026-07-28 | 10/2 | commitا PDF.js وتوثيقه؛ `develop` يحتوي تطبيق PDF.js لاحقاً عبر تاريخ مختلف | لا توجد قدرة ناقصة مثبتة | احتفاظ/مراجعة؛ ممنوع auto-merge |

## فروع Sites القديمة

هذه الفروع ليست مصدر التطبيق. commits/files الفريدة فيها تخص snapshots أو إعداد
نشر قديم، ولا تُنقل إلى `develop`. لا حذف في هذه المهمة.

| الفرع | SHA | التاريخ | D/B | ملفات فريدة | التوصية |
|---|---:|---:|---:|---|---|
| `origin/codex/sites-p3-library-full-source` | `4a552ab` | 2026-07-27 | 16/6 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p3-library-source` | `5ae8840` | 2026-07-27 | 35/5 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p3-native-picker-source` | `99f2099` | 2026-07-28 | 11/9 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p3-upload-fix-source` | `94b23ff` | 2026-07-27 | 14/7 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p3-upload-fix-source-v2` | `7fb8083` | 2026-07-27 | 13/8 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p4-pdfjs-source` | `cc437c2` | 2026-07-28 | 7/12 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `origin/codex/sites-p4-reliability-source` | `61b32c6` | 2026-07-28 | 7/10 | نعم؛ snapshot نشر | أرشفة، مرشح حذف لاحق |
| `sites/main` | `cc437c2` | 2026-07-28 | 7/12 | نفس tip لـSites P4 PDF.js | اترك remote والنشر مجمدين |
| `sites-p3/main` | `ef35349` | 2026-07-25 | 35/0 | لا commit فريد عن develop | اتركه مجمداً؛ مرشح إزالة remote لاحقاً |

## فروع محلية بلا origin

وُجدت فروع محلية أرشيفية/نشرية مثل:

- `codex/local-prototype-archive`
- `codex/sites-notebook-gate-publish`
- `codex/sites-notebook-gate-source`
- `codex/sites-p0-source*`
- `codex/sites-p3-closeout-source`
- `codex/sites-revision-history-*`

لم تُحذف ولم تُدفع ولم تُدمج. يجب تدقيقها في مهمة تنظيف مستقلة بعد Stable Tag.

## المرشحون للحذف لاحقاً — لا إجراء الآن

1. فروع feature القديمة ذات `B=0` بعد إنشاء Tag مستقر ونسخة Backup للمستودع.
2. `setup/project-foundation` لأنه يكرر `phase-0`.
3. فروع Sites source بعد تأكيد أن تاريخ GitHub المطلوب محفوظ وأن النشر القديم لم
   يعد مطلوباً.
4. الفروع المحلية Sites/archive بعد مقارنة الملفات الفريدة.

قرار الحذف يحتاج قائمة صريحة وموافقة المستخدم في مهمة منفصلة.
