# Studio5 Lecture Capture Lab

واجهة مستقلة لاختبار الالتقاط السريع للمحاضرة. تحفظ Captures في IndexedDB عبر Studio5 Core وتعرض Lecture Inbox المشتق.

داخل نطاق هذه الواجهة: الأنواع الخمسة، الحفظ المحلي، آخر الالتقاطات، وعدد العناصر غير المنظمة.

خارج نطاقها: PDF وInk وAI وCloseout UI وتحويل Capture إلى Task.

## Closeout

صفحة `/closeout/` منفصلة الملفات وتقرأ قاعدة IndexedDB نفسها. تنظّم Captures الخام إلى Task أو Review أو Inbox أو Answered أو Dismissed، ثم تكمل Closeout بعد حسمها كلها.
