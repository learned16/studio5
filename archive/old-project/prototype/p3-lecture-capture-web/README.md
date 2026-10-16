# Studio5 Lecture Capture Lab

واجهات مستقلة لاختبار Lecture Flow ومكتبة PDF/Notes. تحفظ البيانات في IndexedDB عبر Studio5 Core وتبقي كل Route قابلة للاستبدال.

داخل نطاق هذه الواجهة: الأنواع الخمسة، الحفظ المحلي، آخر الالتقاطات، وعدد العناصر غير المنظمة.

خارج نطاقها: Ink فوق PDF وAI والمزامنة السحابية.

## Closeout

صفحة `/closeout/` منفصلة الملفات وتقرأ قاعدة IndexedDB نفسها. تنظّم Captures الخام إلى Task أو Review أو Inbox أو Answered أو Dismissed، ثم تكمل Closeout بعد حسمها كلها.

## PDF/Notes Library

صفحة `/library/` منفصلة الملفات وتستخدم FileArtifact immutable وNote في Schema v8. ترفع PDF محلياً، تفتحه بعد Reload، تستعيد Draft، وتستخدم Search وFavorites وRecent من Core.
