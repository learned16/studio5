# P2-CORE-002 - IndexedDB Local Database and Recovery

## الهدف

إضافة طبقة تخزين محلية دائمة لـStudio5 Core باستخدام IndexedDB، مع Journal قبل الكتابة، Transaction ذرية، واستعادة آمنة بعد انقطاع أو فشل أثناء الحفظ.

## الملفات المسموحة

- `packages/studio5-core/**`
- `PROJECT_STATUS.md`
- `docs/tasks/P2-CORE-002.md`

## خارج النطاق

- واجهة المستخدم.
- PDF وInk وAI.
- Schedule وToday وTasks.
- Backup سحابي أو مزامنة متعددة الأجهزة.
- حذف قاعدة البيانات أو بيانات المستخدم من الواجهة.
- تعديل P0 Ink Prototype.

## تصميم الحماية

1. Validate/Migrate للـSnapshot قبل الكتابة.
2. كتابة Pending Journal في Transaction مستقلة أولاً.
3. كتابة Snapshot وحذف Journal داخل Transaction واحدة.
4. إذا فشلت Transaction يبقى Journal للاستعادة.
5. عند الفتح، Journal صالح يُستعاد ويُثبت قبل إعادة البيانات.
6. Journal غير صالح لا يُحذف؛ يظهر CoreRecoveryError ويحافظ على آخر Snapshot سليم كخيار fallback.

## معايير القبول

- أول فتح يعيد Snapshot فارغاً صالحاً.
- Save ثم Load يعيدان البيانات نفسها.
- فشل Commit يبقي Journal.
- الفتح التالي يستعيد Journal ويثبته.
- Commit ناجح يمسح Journal.
- Snapshot قديم يمر عبر Migration قبل الحفظ.
- Journal تالف لا يحذف آخر نسخة سليمة.
- IndexedDB browser smoke ينجح في متصفح حقيقي.
- Lint وType contract وUnit tests ناجحة.

## Rollback

التغيير يضيف Stores جديدة فقط داخل حزمة Core ولا يلمس P0 أو بياناته. الرجوع يكون بعكس Commit الفرع؛ لا توجد بيانات مستخدم إنتاجية على هذا الفرع بعد.

## Evidence

- Syntax/Lint: PASS.
- Module contract: PASS.
- Unit tests: 14/14 PASS.
- فشل Commit وبقاء Journal: PASS.
- Recovery في التشغيل التالي: PASS.
- Journal تالف مع الحفاظ على fallback: PASS.
- Concurrent save serialization: PASS.
- HTTP test harness والـES modules: PASS (200).
- IndexedDB browser smoke: PENDING؛ المتصفح الداخلي حجب عناوين HTTP المحلية بـ`ERR_BLOCKED_BY_CLIENT`.
