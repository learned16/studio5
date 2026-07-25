# P0 Ink Web Candidate A - Test Report

## الحالة

`LOCAL PASS / MATEPAD PENDING`

## النتائج المنفذة

- Syntax check: PASS.
- Static module contract check: PASS.
- Unit tests: 12/12 PASS.
- Worker route test: PASS.
- Static worker build: PASS.
- Browser smoke test: PASS.
- الرسم بالماوس ثم Autosave وإعادة التحميل: PASS.
- Offline reload بعد تفعيل Service Worker: PASS.
- Undo/Redo: PASS.
- الممحاة المقطعية التي لا تحذف الـstroke المتصل بالكامل: PASS آلياً وBrowser smoke.
- منع التحريك باللمس خارج أداة «تحريك»: PASS آلياً.
- Crash journal لنتيجة المسح المقطعي: PASS.
- JSON export: PASS.
- PNG export: PASS.
- أخطاء Console أثناء smoke test: صفر.

## ما لم يثبت بعد

- ضغط قلم Huawei.
- إعادة اختبار Palm rejection الحقيقي بعد إصلاح ملاحظة المستخدم بتاريخ 2026-07-25.
- إعادة اختبار دقة الممحاة المقطعية بالقلم على MatePad.
- Latency خلال جلسة 15 دقيقة.
- Force Kill من نظام MatePad.
- استعادة 1000 stroke على الجهاز.
- استهلاك الذاكرة على الجهاز.

لا يعتمد Stack نهائياً قبل اكتمال الاختبارات اليدوية أعلاه.

## ملاحظات الجهاز والإصلاحات

- ملاحظة المستخدم: راحة اليد كانت تحرك اللوحة أثناء الرسم.
  - القرار: اللمس لا يحرك أو يكبر اللوحة إلا عند اختيار أداة «تحريك».
- ملاحظة المستخدم: الممحاة كانت تحذف الخط المتصل كله عند لمس جزء منه.
  - القرار: تقسيم الخط عند منطقة المسح وحفظ الأجزاء غير الملامسة.
- نتيجة الإصلاح محلياً: Build وType Check و12 اختباراً وBrowser smoke كلها PASS.
