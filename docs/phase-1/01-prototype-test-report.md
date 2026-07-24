# Studio5 P1 — تقرير اختبار Prototype

## بيئة الاختبار الحالية

- المنصة: Codex in-app browser على Windows.
- المسار: Static Web/PWA.
- PDF renderer: Mozilla PDF.js 5.7.284.
- التخزين: IndexedDB + Local Storage emergency journal.

## النتائج

| الاختبار | النتيجة | الدليل |
|---|---|---|
| تحميل التطبيق | Pass | الواجهة العربية ظهرت بلا أخطاء Console |
| فتح PDF | Pass | فتح ملف نموذجي من 14 صفحة |
| رسم بالحبر | Pass جزئي | Pointer down وحفظ stroke؛ جهاز الاختبار لا يمثل القلم الحقيقي |
| حفظ تلقائي | Pass | ظهرت حالة «محفوظ محليًا» |
| استعادة بعد Reload | Pass | عاد PDF والحبر والصفحة |
| تبديل الصفحة | Pass | الانتقال من الصفحة 1 إلى 2 |
| Zoom | Pass | تغير القياس وأبعاد canvas |
| Offline shell | Not tested | يحتاج فصل الشبكة بعد تثبيت Service Worker |
| Palm rejection | Not tested | يحتاج MatePad وM-Pencil |
| Pressure | Not tested | يحتاج M-Pencil |
| Force Kill | Not tested | يحتاج تثبيت التطبيق على الجهاز |

## الملاحظات

- إدخال الماوس في بيئة الاختبار أنتج نقطة محفوظة؛ مسار الحركة الحقيقي يجب قياسه
  بالقلم على الجهاز.
- إحداثيات الحبر مخزنة normalized بين 0 و1 لكل صفحة، ولذلك يعاد رسمها
  وفق قياس الصفحة الحالي بدل ربطها ببكسلات شاشة ثابتة.
- ملف PDF الأصلي لا يُعدل؛ الحبر سجل مستقل مرتبط بمعرف الملف ورقم الصفحة.

## الخطوة التالية

تشغيل Prototype على MatePad وتصدير تقرير JSON من زر «تقرير الاختبار»، ثم
تسجيل القرار:

- Go: متابعة Web-first.
- Conditional Go: متابعة مع قيود موثقة.
- No-Go: بناء Spike مكافئ بـFlutter أو Native وإعادة نفس الاختبار.
