# P2-GATE-RECONCILIATION - توحيد Gate 0 وبوابة Notebook/Revisions

## الهدف

توحيد نتائج Gate 0 المعتمدة داخل خط Phase 2 الأحدث المبني فوق
`codex/p2-revision-history-ui`، وإعداد اختبار MatePad واضح لـP2-GATE-001 وP2-GATE-002
قبل السماح ببدء Phase 3.

## المصدر

- قرار المستخدم الصريح بتاريخ 2026-07-27.
- الفرع `codex/gate0-device-results`.
- الفرع الأساسي `codex/p2-revision-history-ui`.
- `docs/tasks/P0-INK-WEB-TEST-REPORT.md`.

## الملفات المسموحة

- وثائق Gate 0 والقرارات والحالة القادمة من `codex/gate0-device-results`.
- `PROJECT_STATUS.md`.
- `docs/tasks/P2-GATE-RECONCILIATION.md`.
- `docs/tasks/P2-NOTEBOOK-REVISION-MATEPAD-TEST-REPORT.md`.
- ملفات وثائق P2-GATE-001 وP2-GATE-002 عند الحاجة لتصحيح حالة البوابة فقط.

## داخل النطاق

- Merge تاريخ Gate 0 في فرع جديد فوق أحدث Phase 2.
- حل تعارضات الوثائق من دون فقد تقدم P2-CORE-005 إلى P2-GATE-002.
- توحيد الحقيقة:
  - Gate 0 الوظيفي الأصلي مكتمل.
  - Web/PWA معتمد في ADR-008.
  - بوابة Notebook/Revisions الجديدة ما زالت تنتظر اختبار MatePad.
- إنشاء تقرير اختبار يدوي خطوة بخطوة للنسخ والمعاينة والاستعادة الآمنة.
- إيقاف Phase 3 حتى تصل نتيجة الجهاز.

## خارج النطاق

- لا كود تطبيق.
- لا تغيير Schema أو بيانات.
- لا Phase 3.
- لا Merge إلى `main`.
- لا إعلان P2-GATE-001 أو P2-GATE-002 مكتملين قبل نتيجة المستخدم.

## معايير القبول

1. الفرع الجديد مبني فوق `codex/p2-revision-history-ui`.
2. تاريخ `codex/gate0-device-results` موجود كأصل Merge وليس نسخاً يدوياً مجهول المصدر.
3. `PROJECT_STATUS.md` لا يقول إن اختبارات Gate 0 الأصلية معلقة.
4. `ADR-008` و`D-005` بحالة `Adopted`.
5. لا تُخلط بوابة Gate 0 المكتملة مع بوابة Notebook/Revisions المعلقة.
6. تقرير اختبار MatePad الجديد بسيط وقابل للتعبئة ولا يتطلب أدوات تطوير.
7. اختبارات Core وInk regression الحالية تنجح بعد الدمج.
8. الفرع يرفع إلى GitHub ولا يدمج في `main`.

## Rollback

حذف فرع المصالحة يعيد الفروع الأصلية كما هي. لا يعاد كتابة تاريخ أي فرع ولا تحذف بيانات.

## دليل التحقق الحالي

- الحالة: `DONE - MERGED HISTORY / VERIFIED / PUSHED`.
- الفرع: `codex/p2-gate-reconciliation`.
- تاريخ `codex/gate0-device-results` دخل كـMerge حقيقي فوق أحدث خط Phase 2.
- فحص تعارضات Markdown: لا توجد conflict markers.
- Studio5 Core: `54/54 PASS`.
- Ink/Notebook Demo: `15/15 PASS`.
- Core Type Check: `PASS`.
- Core Lint/Syntax: `PASS`.
- Ink Type Check: `PASS`.
- Ink Lint/Syntax: `PASS`.
- Static worker build: `PASS`.
- بوابة MatePad الخاصة بـNotebook/Revisions: `PENDING USER TEST`.
- الفرع مرفوع إلى `origin/codex/p2-gate-reconciliation` ولم يُدمج في `main`.
