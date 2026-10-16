# جاهزية Studio5 للتغليف كتطبيق مثبت مستقبلاً

## الهدف والقرار الحالي

Studio5 يبقى Web/PWA في الإصدار الأول. لا نضيف Capacitor أو Tauri ولا نعيد الكتابة
بـFlutter أو Native الآن. المطلوب هو حماية منطق Core ومنع ربطه ببيئة المتصفح حتى
يمكن تغليفه لاحقاً بأقل تغيير.

## الحالة الحالية

### قابل لإعادة الاستخدام

- `packages/studio5-core/src/model.mjs` وSchema وMigrations وRepository وToday
  وSearch وOffline Queue وBackup لا تعتمد مباشرة على `window` أو `document`.
- Stable IDs والعلاقات والتحقق من المحتوى والنسخ الاحتياطية تبقى نفسها داخل أي
  غلاف Native.
- IndexedDB معزول في:
  - `indexeddb-driver.mjs`
  - `indexeddb-file-content-store.mjs`
  - `browser-storage-migration.mjs`
- واجهات P0 وP3 هي طبقة Browser/Prototype وتحتوي DOM وPointer Events وFile
  Picker وDownload وService Worker، وهذا مقبول ما دام لا ينتقل إلى Domain Core.

### Coupling يجب مراقبته

- P0 يجمع Canvas rendering وDOM events والتصدير داخل `app.mjs`.
- P3 يستخدم File input وBlob URL وdownload anchor و`navigator.serviceWorker`
  داخل واجهات Library/Reliability.
- Runtimes في P3 تنشئ Browser adapters مباشرة؛ يجب أن تصبح composition root
  واضحة قبل إضافة غلاف Native.
- بيانات IndexedDB مرتبطة بالـorigin؛ الانتقال إلى APK أو غلاف جديد يحتاج Import
  صريح من Backup، لا افتراض أن قاعدة المتصفح ستظهر تلقائياً.

لا يوجد coupling حرج يبرر Refactor واسع قبل Phase 5.

## الحدود المستهدفة

```text
Application Core
├── StoragePort
│   ├── IndexedDbStorageAdapter
│   └── NativeStorageAdapter لاحقاً
├── FilePort
│   ├── BrowserFileAdapter
│   └── NativeFileAdapter لاحقاً
├── PdfPort
│   ├── PdfJsAdapter
│   └── NativePdfAdapter اختياري
├── InkPort
│   ├── PointerEventInkAdapter
│   └── NativePenAdapter اختياري
├── BackupPort
│   ├── BrowserDownloadAdapter
│   └── NativeShareFileAdapter
├── NotificationPort
└── PlatformPort
```

كل Port يجب أن يمرر بيانات محايدة قابلة للاختبار؛ لا يعيد DOM nodes أو native
handles إلى Core.

## العقود المقترحة

### StoragePort

- فتح schema version معلوم.
- transaction ذرية.
- read/list/upsert/delete صريح.
- تخزين bytes منفصل عن metadata.
- فشل واضح عند quota أو corruption.
- Export snapshot وrestore staged.

### FilePort

- `pickFile(acceptedTypes)`.
- `readBytes(handle)`.
- `saveFile(name, bytes, mediaType)`.
- `shareFile` لاحقاً.
- إلغاء المستخدم نتيجة مستقلة عن الخطأ.

### PdfPort

- فتح bytes محلية.
- عدد الصفحات.
- render صفحة إلى سطح تحدده الواجهة.
- إلغاء render سابق.
- تحرير الموارد بعد الإغلاق.

### InkPort

- pointer/pen samples محايدة: x وy والوقت والضغط والنوع.
- palm rejection policy.
- تحويل viewport منفصل عن stroke data.
- autosave وjournal عبر Core/Storage لا عبر Canvas bitmap فقط.

### PlatformPort

- حالة online/offline.
- lifecycle: active/background/terminate.
- معلومات قدرات القلم والضغط.
- فتح Settings أو مشاركة ملف عند توفرها.

## ما يعاد استخدامه عند التغليف

- كل Domain/Core وSchemas وMigrations وBackup format.
- واجهات HTML/CSS/JS الحالية مبدئياً.
- PDF.js إن كان أداء WebView مناسباً.
- Pointer Events إن كانت WebView الخاصة بالجهاز تعطي ضغطاً وPalm rejection
  مقبولين.
- اختبارات Core كاملة واختبارات Schema 7→8.

## ما يحتاج Adapter جديداً

- اختيار الملفات والتنزيل والمشاركة.
- تخزين الملفات الكبيرة وquota.
- notifications.
- lifecycle/background save.
- صلاحيات Android.
- استيراد Backup من نسخة Web إلى نسخة مثبتة.

## Capacitor أم Tauri؟

القرار مؤجل إلى بوابة تقنية مستقلة بعد الإصدار الأول:

- Capacitor مناسب لمسار Android/Web-first ويضيف APIs وPlugins أصلية مع إبقاء
  واجهة الويب.
- Tauri يدعم desktop وmobile ويحتاج Rust وAndroid toolchain؛ قد يكون مناسباً إذا
  أصبح Desktop هدفاً مساوياً للتابلت.

الترشيح الأولي لـMatePad هو تجربة Capacitor أولاً، ثم مقارنة Tauri على جهاز حقيقي.
لا يعتمد أي منهما قبل اختبار القلم والضغط وFile APIs وPDF وBackup داخل WebView.

مراجع رسمية:

- https://capacitorjs.com/docs
- https://v2.tauri.app/start/
- https://v2.tauri.app/start/prerequisites/

## مخاطر Huawei/MatePad

- اختلاف WebView/HarmonyOS والإصدارات عن Chrome العادي.
- Pointer Events والضغط وPalm rejection قد تختلف داخل الغلاف عن المتصفح.
- File Picker وDocument Provider وصلاحيات الملفات.
- إيقاف التطبيق بالخلفية والحفظ قبل kill.
- حدود التخزين ونسخ Backup إلى Downloads.
- عدم توفر Google Play Services؛ لا يجوز ربط الوظائف الأساسية بها.

## بوابة القرار المستقبلية

1. Freeze لنسخة Web مستقرة وBackup قابل للتحقق.
2. نموذج صغير يغلّف build نفسه بلا تغيير Core.
3. اختبار MatePad: pressure، palm rejection، 1000 stroke، PDF كبير،
   force-kill/recovery، picker، backup/restore.
4. مقارنة حجم التطبيق والذاكرة والبدء والبطارية.
5. اختيار Adapter strategy وتسجيل ADR.
6. توفير Import من Backup قبل تجربة بيانات حقيقية.

## ممنوع قبل البوابة

- نقل منطق البيانات إلى Plugin Native.
- إنشاء Schema مختلف للنسخة المثبتة.
- تعديل Backup format لخدمة غلاف بعينه.
- الاعتماد على path محلي ثابت.
- حذف نسخة Web أو إجبار المستخدم على migration غير قابل للرجوع.
