# Studio5 P0 Ink Web - Candidate A

Prototype معزول لاختبار القلم والحفظ والاستعادة قبل اعتماد تقنية Studio5 النهائية.

## داخل النطاق

- قلم وممحاة.
- ضغط القلم عند توفره.
- منع الرسم باللمس افتراضياً لدعم Palm rejection.
- Pan وPinch Zoom وأزرار Zoom/Fit.
- Autosave في IndexedDB مع LocalStorage fallback.
- Emergency journal لاستعادة stroke غير المكتمل بعد الإغلاق.
- Undo/Redo.
- تصدير PNG وJSON مع manifest.
- Offline cache بعد أول فتح عبر HTTPS أو localhost.

## خارج النطاق

PDF، المواد، AI، المزامنة السحابية، الحسابات، وDrawing Coach.

## الفحص المحلي

استخدم Node 22 أو أحدث:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

## اختبار MatePad

1. افتح الرابط المنشور باستخدام قلم Huawei.
2. ارسم 15 دقيقة وراقب الاستجابة والضغط من شاشة التشخيص.
3. جرّب الممحاة وZoom/Pan.
4. ارسم خطاً ثم أغلق المتصفح بالقوة من شاشة التطبيقات.
5. افتح الرابط وتحقق من استعادة الخط.
6. افصل الإنترنت وكرر الرسم والحفظ بعد أن تُفتح النسخة مرة واحدة على HTTPS.
7. صدّر PNG وJSON وتأكد أن الملفين قابلان للفتح.

نجاح المتصفح ليس قرار Stack نهائياً؛ يسجل القياس على الجهاز الحقيقي في تقرير P0.
