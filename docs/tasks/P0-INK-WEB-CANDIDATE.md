# P0 - Ink Web Candidate A

## الهدف

اختبار ما إذا كانت PWA تستطيع تقديم قلم وحفظ واستعادة مقبولين على HUAWEI MatePad 11.5 PaperMatte قبل اختيار التقنية النهائية.

## النطاق

المجلد الوحيد للتنفيذ: `prototype/p0-ink-web/`.

## لا يجوز تغييره

- لا PDF أو مواد أو AI أو حسابات.
- لا تغيير لنموذج Core أو قرارات السنوات اللاحقة.
- لا اعتبار Candidate A تقنية نهائية قبل دليل جهاز حقيقي.

## معايير القبول

المعايير في `docs/ACCEPTANCE_TESTS.md` تحت P0، مع دليل يدوي للقلم والضغط وPalm rejection والLatency وForce Kill على MatePad.

## الاختبارات

- اختبارات وحدة لحسابات الإحداثيات والضغط وHit testing وCrash journal وschema.
- Syntax checks لوحدات المتصفح.
- Static build verification.
- اختبار يدوي على الجهاز الحقيقي.

## Rollback

الـPrototype معزول. يمكن رفض Candidate A وحذف فرعه من دون أي Migration أو مساس بوثائق التأسيس أو بيانات Studio5 المستقبلية.
